import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
  
  it("should unblock a blocked number", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const numbers = await caller.whatsapp.listNumbers();
    const blockedNumber = numbers.find(n => n.calculatedStatus === "blocked");
    
    if (blockedNumber) {
      const result = await caller.whatsapp.unblockNumber({ id: blockedNumber.id });
      expect(result).toEqual({ success: true });
      
      const updatedNumbers = await caller.whatsapp.listNumbers();
      const unblocked = updatedNumbers.find(n => n.id === blockedNumber.id);
      expect(unblocked?.calculatedStatus).not.toBe("blocked");
    }
  });
  
  it("should add a new number", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const newPhone = `+55 11 ${Math.floor(90000000 + Math.random() * 10000000)}`;
    
    const result = await caller.whatsapp.addNumber({
      phoneNumber: newPhone,
      displayName: "Teste Novo",
    });
    
    expect(result).toEqual({ success: true });
    
    const numbers = await caller.whatsapp.listNumbers();
    const added = numbers.find(n => n.phoneNumber === newPhone);
    expect(added).toBeDefined();
    expect(added?.displayName).toBe("Teste Novo");
  });
  
  it("should delete a number", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const numbers = await caller.whatsapp.listNumbers();
    const testNumber = numbers.find(n => n.displayName === "Teste Novo");
    
    if (testNumber) {
      const result = await caller.whatsapp.deleteNumber({ id: testNumber.id });
      expect(result).toEqual({ success: true });
      
      const updatedNumbers = await caller.whatsapp.listNumbers();
      const deleted = updatedNumbers.find(n => n.id === testNumber.id);
      expect(deleted).toBeUndefined();
    }
  });
});
