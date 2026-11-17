# CARTIFY — Shopping storefront starter

CARTIFY is a mobile-friendly storefront starter saved in the cartify/ folder of the Boostora repository.

## Preview

After enabling GitHub Pages for this repository, the site path will be:

https://sachink15780-ops.github.io/Boostora/cartify/

GitHub Pages must be enabled in repository Settings → Pages, with source set to the main branch. If Pages is not enabled yet, this URL will not work.

## Included in this starter

- Responsive product catalogue and product search
- Cart with quantity and subtotal
- Sign-up/sign-in flow in local demo mode
- Checkout requires sign-in
- Delivery form: customer name, primary/alternate mobile, PIN, district, state, house/flat, street, area, landmark, post office, address type and delivery instructions
- PIN lookup using India Post's public pincode API
- Optional GPS capture only after the customer taps the location button and grants permission
- Demo order list and basic admin preview
- Optional Google Sheets endpoint hook (window.CARTIFY_SHEETS_ENDPOINT)

## Important: current status

This is a FRONT-END STARTER / DEMO, not a production-ready shop yet. Demo users, cart and orders are saved in that browser's local storage only. They do not sync between devices, and the demo admin view is not protected by real admin authentication. The Google sign-in button is a setup placeholder. Do not collect real customer data or accept real payments until the backend is configured and tested.

## Production setup still required

1. Create a Firebase project.
2. Enable Firebase Authentication (Email/Password and Google providers).
3. Add Firebase web configuration and implement Firebase Auth in the storefront.
4. Create Firestore collections for products, orders and user profiles.
5. Apply Firestore security rules so customers can read/write only their own profile and orders; only an authenticated admin (custom claim) can manage all orders/products and see purchase costs/profit.
6. Deploy a trusted backend (for example Firebase Cloud Functions) that verifies Firebase ID tokens and writes order rows to Google Sheets using a service account. Keep service-account credentials and all privileged secrets on the server, never in browser JavaScript.
7. Add the deployed backend URL as window.CARTIFY_SHEETS_ENDPOINT in a deployment config, and test a complete order before launch.
8. Add an actual payment gateway if online prepaid payments are needed. The current COD/prepaid selector is informational only and does not process money.

## Google Sheets columns suggested

Order ID, created time, customer email, full name, primary mobile, alternate mobile, PIN code, district, state, house/flat, street/building, area/colony, landmark, post office, address type, delivery instructions, GPS latitude, GPS longitude, products, quantities, selling total, Meesho purchase cost, profit, payment method, order status.

## Product and margin management

Replace the sample products in index.html with your actual catalogue. For accurate profit, record Meesho purchase cost per item in the trusted backend/admin system. Never accept purchase cost or profit values submitted by the customer browser as authoritative.

## Privacy

Customer names, phone numbers and delivery addresses are personal data. Restrict access, collect only what is needed, publish a privacy policy and retention policy, and test permissions before going live.
