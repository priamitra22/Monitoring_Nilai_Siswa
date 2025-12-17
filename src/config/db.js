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

let db;

function handleDisconnect() {
  db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error("❌ Database gagal terkoneksi:", err.message);
      setTimeout(handleDisconnect, 2000);
      return;
    }
    console.log("✅ Database MySQL terkoneksi");
    if (useSSL) {
      console.log("☁️ Connected to Aiven MySQL Cloud");
    }
  });

  db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' ||
      err.code === 'ECONNRESET' ||
      err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
      console.log('🔄 Reconnecting to database...');
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

export default db;



