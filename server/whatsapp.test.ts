import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("WhatsApp Number Management", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);
  
  it("should list all numbers", async () => {
    const numbers = await caller.whatsapp.listNumbers();
    
    expect(numbers).toBeDefined();
    expect(Array.isArray(numbers)).toBe(true);
    expect(numbers.length).toBeGreaterThan(0);
  });
  
  it("should calculate status correctly", async () => {
    const numbers = await caller.whatsapp.listNumbers();
    
    numbers.forEach(num => {
      expect(num).toHaveProperty("calculatedStatus");
      expect(["available", "cooldown", "blocked"]).toContain(num.calculatedStatus);
      expect(num).toHaveProperty("timeRemaining");
      expect(typeof num.timeRemaining).toBe("number");
    });
  });
  
  it("should provide intelligent suggestion", async () => {
    const suggestion = await caller.whatsapp.getSuggestion();
    
    // Pode ser null se todos estão em cooldown
    if (suggestion) {
      expect(suggestion).toHaveProperty("id");
      expect(suggestion).toHaveProperty("phoneNumber");
      expect(suggestion.phoneNumber).toMatch(/^\+55/);
    }
  });
  
  it("should register number usage", async () => {
    const numbers = await caller.whatsapp.listNumbers();
    const availableNumber = numbers.find(n => n.calculatedStatus === "available");
    
    if (availableNumber) {
      const result = await caller.whatsapp.useNumber({
        id: availableNumber.id,
        contactCount: 45,
        notes: "Teste automatizado",
      });
      
      expect(result).toEqual({ success: true });
      
      // Verifica se o número entrou em cooldown
      const updatedNumbers = await caller.whatsapp.listNumbers();
      const usedNumber = updatedNumbers.find(n => n.id === availableNumber.id);
      
      expect(usedNumber?.calculatedStatus).toBe("cooldown");
      expect(usedNumber?.lastContactCount).toBe(45);
    }
  });
  
  it("should block number manually", async () => {
    const numbers = await caller.whatsapp.listNumbers();
    const testNumber = numbers[0];
    
    if (testNumber) {
      const result = await caller.whatsapp.blockNumber({
        id: testNumber.id,
        hours: 48,
        notes: "Teste de bloqueio",
      });
      
      expect(result).toEqual({ success: true });
      
      // Verifica se o número foi bloqueado
      const updatedNumbers = await caller.whatsapp.listNumbers();
      const blockedNumber = updatedNumbers.find(n => n.id === testNumber.id);
      
      expect(blockedNumber?.calculatedStatus).toBe("blocked");
      expect(blockedNumber?.isSensitive).toBe(true);
    }
  });
  
  it("should retrieve usage history", async () => {
    const history = await caller.whatsapp.getHistory({ limit: 10 });
    
    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
    
    if (history.length > 0) {
      const record = history[0];
      expect(record).toHaveProperty("phoneNumber");
      expect(record).toHaveProperty("contactCount");
      expect(record).toHaveProperty("usedAt");
    }
  });
  
  it("should respect 24h cooldown period", async () => {
    const numbers = await caller.whatsapp.listNumbers();
    
    const cooldownNumbers = numbers.filter(n => n.calculatedStatus === "cooldown");
    
    cooldownNumbers.forEach(num => {
      if (num.lastUsedAt) {
        const now = new Date();
        const cooldownEnd = new Date(num.lastUsedAt.getTime() + 24 * 60 * 60 * 1000);
        
        // Se está em cooldown, o tempo de cooldown ainda não passou
        expect(cooldownEnd.getTime()).toBeGreaterThan(now.getTime());
        expect(num.timeRemaining).toBeGreaterThan(0);
      }
    });
  });
});
