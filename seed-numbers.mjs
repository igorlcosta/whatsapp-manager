import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const numbers = [
  "+55 16 98231-0145",
  "+55 14 98225-0395",
  "+55 16 98809-1167", // Número corrigido
  "+55 18 98192-0346",
  "+55 21 95946-1932",
  "+55 12 98318-0792",
  "+55 11 93017-4097",
  "+55 11 95383-0643",
  "+55 11 95369-8149",
  "+55 21 96543-9526",
  "+55 11 95371-7951",
  "+55 11 95383-9213",
  "+55 16 98235-0233",
];

async function seedNumbers() {
  try {
    console.log("Inserindo números no banco de dados...");
    
    for (const phoneNumber of numbers) {
      const [result] = await connection.execute(
        `INSERT INTO whatsapp_numbers (phone_number, status, is_sensitive)
         VALUES (?, 'available', 0)
         ON DUPLICATE KEY UPDATE phone_number = phone_number`,
        [phoneNumber]
      );
      console.log(`✓ ${phoneNumber}`);
    }
    
    console.log("\n✅ Todos os números foram inseridos com sucesso!");
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao inserir números:", error);
    await connection.end();
    process.exit(1);
  }
}

seedNumbers();
