# BOOSTORA

Mobile-friendly SMM services panel.

## Planned architecture
- Frontend: `index.html`
- Authentication and data: Firebase Authentication + Cloud Firestore
- Deposits: UPI manual verification; user submits UTR, owner verifies in UPI/bank app
- Fulfilment: manual admin processing
- Minimum deposit: INR 10

## Setup
1. Create a Firebase project and add a Web App.
2. Enable Email/Password in Authentication.
3. Create a Cloud Firestore database.
4. Publish `firestore.rules`.
5. Copy `firebase-config.example.js` to `firebase-config.js` and fill in the Firebase Web App config.
6. Never publish service-account keys, private keys, or payment credentials in frontend code.

## Safety
- UPI screenshots and UTRs are claims, not proof of payment.
- Do not credit wallets until the payment is verified in the owner's UPI/bank app.
- Wallet balances and admin roles must be controlled by trusted server/admin logic.
- Never ask customers for social-media passwords, session cookies, or login codes.

## Status
The existing `index.html` is currently a frontend preview. Authentication, Firestore integration, admin approvals, and real order processing are not live yet. Do not collect customer money until the complete flow is configured and tested.
