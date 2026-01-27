import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, usageHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// WhatsApp Number Management Queries

export async function getAllWhatsappNumbers() {
  const db = await getDb();
  if (!db) return [];
  
  const { whatsappNumbers } = await import("../drizzle/schema");
  return db.select().from(whatsappNumbers).orderBy(whatsappNumbers.phoneNumber);
}

export async function getWhatsappNumberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { whatsappNumbers } = await import("../drizzle/schema");
  const result = await db.select().from(whatsappNumbers).where(eq(whatsappNumbers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateWhatsappNumber(id: number, data: Partial<{
  status: "available" | "cooldown" | "blocked";
  lastUsedAt: Date | null;
  lastContactCount: number;
  totalUseCount: number;
  blockedUntil: Date | null;
  isSensitive: number;
}>) {
  const db = await getDb();
  if (!db) return;
  
  const { whatsappNumbers } = await import("../drizzle/schema");
  await db.update(whatsappNumbers).set(data).where(eq(whatsappNumbers.id, id));
}

export async function insertUsageHistory(data: {
  numberId: number;
  phoneNumber: string;
  contactCount: number;
  notes?: string;
  wasBlocked?: number;
}) {
  const db = await getDb();
  if (!db) return;
  
  const { usageHistory } = await import("../drizzle/schema");
  await db.insert(usageHistory).values({
    numberId: data.numberId,
    phoneNumber: data.phoneNumber,
    contactCount: data.contactCount,
    notes: data.notes,
    wasBlocked: data.wasBlocked ?? 0,
  });
}

export async function getUsageHistory(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const { usageHistory } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  return db.select().from(usageHistory).orderBy(desc(usageHistory.usedAt)).limit(limit);
}

export async function unblockWhatsappNumber(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { whatsappNumbers } = await import("../drizzle/schema");
  await db
    .update(whatsappNumbers)
    .set({
      blockedUntil: null,
      isSensitive: 0,
      updatedAt: new Date(),
    })
    .where(eq(whatsappNumbers.id, id));
}

export async function deleteWhatsappNumber(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { whatsappNumbers, usageHistory } = await import("../drizzle/schema");
  
  // Primeiro deleta o histórico relacionado
  await db.delete(usageHistory).where(eq(usageHistory.numberId, id));
  
  // Depois deleta o número
  await db.delete(whatsappNumbers).where(eq(whatsappNumbers.id, id));
}

export async function addWhatsappNumber(phoneNumber: string, displayName?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { whatsappNumbers } = await import("../drizzle/schema");
  
  // Número novo entra em cooldown automático de 24h
  // Isso protege números de WhatsApp recém-criados
  const now = new Date();
  
  const result = await db.insert(whatsappNumbers).values({
    phoneNumber,
    displayName: displayName || null,
    status: "cooldown",
    lastUsedAt: now, // Define como "usado agora" para iniciar cooldown de 24h
  });
  
  return result;
}

export async function deleteHistoryEntry(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  await db.delete(usageHistory).where(eq(usageHistory.id, id));
}

export async function clearAllHistory(): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Deleta todo o histórico
  await db.delete(usageHistory);
}
