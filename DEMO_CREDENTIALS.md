# Demo credentials – AIPay Shield

Use these to sign in and try the platform. **Password for all accounts: `Demo@123`**

| Role     | Email             | Purpose                          |
|----------|-------------------|----------------------------------|
| Admin    | admin@demo.com    | Full access, analytics dashboard  |
| Merchant | merchant@demo.com | Payments, has linked merchant    |
| Analyst  | analyst@demo.com  | View analytics and notifications |
| User     | user@demo.com     | Regular user (no merchant)       |

## First-time setup

1. **Start the database** (e.g. Docker):
   ```bash
   cd docker && docker-compose up -d postgres
   ```

2. **Run migrations** (if not already done): ensure `database/init.sql` has been applied to the `fintech` database.

3. **Seed demo users and merchant**:
   ```bash
   set DATABASE_URL=postgres://fintech:fintech@localhost:5432/fintech
   npm run seed
   ```
   Or with Docker:
   ```bash
   docker-compose exec postgres psql -U fintech -d fintech -f /docker-entrypoint-initdb.d/init.sql
   ```
   Then from host (with Postgres exposed):
   ```bash
   set DATABASE_URL=postgres://fintech:fintech@localhost:5432/fintech
   npm run seed
   ```

4. **Start all services** (gateway, auth, payment, currency, fraud, analytics, notification) and the **frontend** on port 3001.

## Sign in

- Open the app (e.g. `http://localhost:3001`).
- Go to **Login** and use any of the emails above with password **`Demo@123`**.
- After login you are taken to the **Admin dashboard**. Use **Profile** (or the `/auth/profile` API with your token) to get your `id` and, for merchants, `merchant_id` for creating payments.

## Creating a payment (API)

With a valid JWT and after seeding:

1. **GET** `/auth/profile` with header `Authorization: Bearer <your_access_token>` to get your `id` and, if you are a merchant, `merchant_id`.
2. **POST** `/payments/create-payment` with body:
   ```json
   {
     "user_id": "<your user id from profile>",
     "merchant_id": "<merchant_id from profile or any seeded merchant>",
     "amount": 100,
     "currency": "USD",
     "target_currency": "INR",
     "payment_method": "card",
     "transaction_reference": "ORDER-001"
   }
   ```
3. **POST** `/payments/confirm-payment` with `{ "transaction_id": "<id from step 2>" }`.

Use **merchant@demo.com** to get a user that has a `merchant_id`; other roles can still create payments if you use a valid `merchant_id` from the database (e.g. the one linked to merchant@demo.com).
