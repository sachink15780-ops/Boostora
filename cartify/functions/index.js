const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { google } = require("googleapis");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();

const GOOGLE_SERVICE_ACCOUNT_JSON = defineSecret("GOOGLE_SERVICE_ACCOUNT_JSON");
const GOOGLE_SHEET_ID = defineSecret("GOOGLE_SHEET_ID");

function cleanString(value, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function requireText(value, label, max = 180) {
  const result = cleanString(value, max);
  if (!result) throw new HttpsError("invalid-argument", label + " is required.");
  return result;
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

async function appendOrderToSheet(order, serviceAccountJson, spreadsheetId) {
  if (!serviceAccountJson || !spreadsheetId) {
    console.warn("Sheets sync skipped: server secrets are not configured.");
    return false;
  }

  const credentials = JSON.parse(serviceAccountJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
  const sheets = google.sheets({ version: "v4", auth });
  const products = (order.items || []).map(item =>
    `${item.name} x ${item.quantity}`
  ).join("; ");

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Orders!A:Z",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[
        order.orderId,
        order.createdAt,
        order.userId,
        order.customer.email,
        order.customer.name,
        order.customer.mobile,
        order.customer.alternateMobile,
        order.address.pincode,
        order.address.district,
        order.address.state,
        order.address.house,
        order.address.street,
        order.address.area,
        order.address.landmark,
        order.address.postOffice,
        order.address.type,
        order.address.instructions,
        order.address.gps,
        products,
        order.total,
        order.purchaseCost,
        order.profit,
        order.paymentMethod,
        order.status
      ]]
    }
  });
  return true;
}

exports.createOrder = onCall(
  {
    region: "asia-south1",
    secrets: [GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_SHEET_ID],
    cors: true
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Please sign in before placing an order.");
    }

    const data = request.data || {};
    const customer = data.customer || {};
    const address = data.address || {};
    const items = Array.isArray(data.items) ? data.items : [];

    if (items.length < 1 || items.length > 30) {
      throw new HttpsError("invalid-argument", "Your cart is empty or contains too many items.");
    }

    const name = requireText(customer.name, "Customer name");
    const mobile = normalizePhone(customer.mobile);
    if (mobile.length !== 10) {
      throw new HttpsError("invalid-argument", "Enter a valid 10-digit mobile number.");
    }

    const pincode = String(address.pincode || "").replace(/\D/g, "");
    if (!/^\d{6}$/.test(pincode)) {
      throw new HttpsError("invalid-argument", "Enter a valid 6-digit PIN code.");
    }

    const safeItems = items.map((item) => {
      const productId = requireText(item.productId, "Product ID", 100);
      const quantity = Math.max(1, Math.min(20, Number.parseInt(item.quantity, 10) || 1));
      const productName = requireText(item.name, "Product name");
      const price = Number(item.price);
      if (!Number.isFinite(price) || price < 1 || price > 1000000) {
        throw new HttpsError("invalid-argument", "Invalid product price.");
      }
      return { productId, name: productName, quantity, price };
    });

    const total = safeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderId = "CT-" + crypto.randomBytes(5).toString("hex").toUpperCase();
    const now = new Date().toISOString();

    const order = {
      orderId,
      userId: request.auth.uid,
      customer: {
        email: cleanString(request.auth.token.email, 180),
        name,
        mobile,
        alternateMobile: normalizePhone(customer.alternateMobile)
      },
      address: {
        pincode,
        district: requireText(address.district, "District"),
        state: requireText(address.state, "State"),
        house: requireText(address.house, "House/flat"),
        street: cleanString(address.street),
        area: requireText(address.area, "Area/colony"),
        landmark: cleanString(address.landmark),
        postOffice: cleanString(address.postOffice),
        type: cleanString(address.type, 30),
        instructions: cleanString(address.instructions, 500),
        gps: cleanString(address.gps, 100)
      },
      items: safeItems,
      total,
      purchaseCost: null,
      profit: null,
      paymentMethod: data.paymentMethod === "COD" ? "COD" : "PREPAID_PENDING",
      status: "PLACED",
      createdAt: now,
      createdAtServer: FieldValue.serverTimestamp()
    };

    await db.collection("orders").doc(orderId).create(order);

    try {
      await appendOrderToSheet(
        order,
        GOOGLE_SERVICE_ACCOUNT_JSON.value(),
        GOOGLE_SHEET_ID.value()
      );
      await db.collection("orders").doc(orderId).update({ sheetsSynced: true });
    } catch (error) {
      console.error("Google Sheets sync failed:", error);
      await db.collection("orders").doc(orderId).update({
        sheetsSynced: false,
        sheetsSyncError: String(error.message || error).slice(0, 300)
      });
    }

    return { success: true, orderId, total, status: order.status };
  }
);

exports.setOrderStatus = onCall(
  { region: "asia-south1" },
  async (request) => {
    if (!request.auth || request.auth.token.admin !== true) {
      throw new HttpsError("permission-denied", "Admin access required.");
    }
    const orderId = requireText(request.data && request.data.orderId, "Order ID", 80);
    const status = requireText(request.data && request.data.status, "Order status", 40);
    const allowed = ["PLACED", "CONFIRMED", "PURCHASED", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!allowed.includes(status)) {
      throw new HttpsError("invalid-argument", "Unsupported order status.");
    }
    await db.collection("orders").doc(orderId).update({
      status,
      updatedAt: FieldValue.serverTimestamp()
    });
    return { success: true, orderId, status };
  }
);