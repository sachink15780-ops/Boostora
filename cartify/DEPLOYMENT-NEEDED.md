# CARTIFY production activation

The repository now includes a secure Cloud Functions starting point and Firestore rules. This is not yet a live production backend.

## Required external account setup

1. Create/select a Firebase project and enable the Blaze plan if required by Cloud Functions and outbound Google APIs.
2. Enable Firebase Authentication (Email/Password and Google), create a Firestore database, and register the web app.
3. Deploy `firestore.rules` and `functions/` from the `cartify` folder.
4. Create a Google Sheet with a tab named `Orders` and share it with the service-account email as Editor.
5. Store the service account JSON as the Firebase secret `GOOGLE_SERVICE_ACCOUNT_JSON` and the spreadsheet ID as `GOOGLE_SHEET_ID`. Never put these values in browser JavaScript or GitHub.
6. Set the admin user's Firebase custom claim `admin: true` using a trusted Admin SDK environment. Do not grant admin from the browser.
7. Replace the demo localStorage authentication/order flow in `index.html` with Firebase Auth and the callable `createOrder` function before taking real orders.
8. Test customer isolation, admin access, order creation, Sheets sync, and failure handling before launch.

## Important

- The storefront in `index.html` is still a demo until Firebase Auth is wired in.
- The backend accepts authenticated users only. Admin-only order status updates require the trusted custom claim.
- Product prices must eventually be loaded and verified from Firestore on the server. Do not trust client-supplied prices for real sales.
- Payment collection is not implemented. `PREPAID_PENDING` is only a status label, not a payment gateway.
- Meesho purchase cost and profit are intentionally not guessed; they must be entered/verified by the admin after sourcing.
- Do not commit Firebase service-account keys, API secrets, customer data, or passwords.
