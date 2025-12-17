import mysql from "mysql2";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const useSSL = process.env.DB_SSL === 'true';

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

if (useSSL) {
  const caPath = path.join(process.cwd(), 'certs', 'aiven-ca.pem');

  if (fs.existsSync(caPath)) {
    dbConfig.ssl = {
      ca: fs.readFileSync(caPath),
      rejectUnauthorized: true
    };
  }
}

const pool = mysql.createPool(dbConfig);

pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database gagal terkoneksi:", err.message);
    return;
  }
  console.log("✅ Database MySQL terkoneksi (Pool)");
  if (useSSL) {
    console.log("☁️ Connected to Aiven MySQL Cloud");
  }
  connection.release();
});

export default pool;

