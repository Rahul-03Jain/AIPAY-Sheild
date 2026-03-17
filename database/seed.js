/**
 * Seed demo users and a merchant. Run from project root:
 *   node database/seed.js
 * Requires: DATABASE_URL environment variable (e.g. postgres://fintech:fintech@localhost:5432/fintech)
 */
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://fintech:fintech@localhost:5432/fintech";
const DEMO_PASSWORD = "Demo@123";

const pool = new Pool({ connectionString: DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

    const users = [
      { email: "admin@demo.com", full_name: "Demo Admin", role: "admin" },
      { email: "merchant@demo.com", full_name: "Demo Merchant", role: "merchant" },
      { email: "analyst@demo.com", full_name: "Demo Analyst", role: "analyst" },
      { email: "user@demo.com", full_name: "Demo User", role: "user" },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (email, password_hash, full_name, role, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           full_name = EXCLUDED.full_name,
           role = EXCLUDED.role,
           status = 'active',
           updated_at = now()`,
        [u.email, hash, u.full_name, u.role]
      );
      console.log("User upserted:", u.email);
    }

    const merchantUser = await client.query(
      "SELECT id FROM users WHERE email = 'merchant@demo.com' LIMIT 1"
    );
    if (merchantUser.rowCount > 0) {
      const userId = merchantUser.rows[0].id;
      await client.query(
        `INSERT INTO merchants (user_id, name, website_url, business_category, risk_score, status)
         VALUES ($1, 'Demo Store', 'https://demo.example.com', 'retail', 0.1, 'active')
         ON CONFLICT (user_id) DO UPDATE SET
           name = EXCLUDED.name,
           risk_score = EXCLUDED.risk_score,
           updated_at = now()`,
        [userId]
      );
      console.log("Merchant upserted for merchant@demo.com");
    }

    console.log("\nSeed done. Demo credentials (password for all):", DEMO_PASSWORD);
    console.log("  admin@demo.com, merchant@demo.com, analyst@demo.com, user@demo.com");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
