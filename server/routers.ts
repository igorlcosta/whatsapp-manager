import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  whatsapp: router({
    // Lista todos os números com status calculado em tempo real
    listNumbers: publicProcedure.query(async () => {
      const { getAllWhatsappNumbers } = await import("./db");
      const numbers = await getAllWhatsappNumbers();
      const now = new Date();
      
      return numbers.map(num => {
        let calculatedStatus: "available" | "cooldown" | "blocked" = "available";
        let timeRemaining = 0;
        
        // Verifica se está bloqueado manualmente
        if (num.blockedUntil && num.blockedUntil > now) {
          calculatedStatus = "blocked";
          timeRemaining = Math.floor((num.blockedUntil.getTime() - now.getTime()) / 1000);
        }
        // Verifica cooldown de 24h
        else if (num.lastUsedAt) {
          const cooldownEnd = new Date(num.lastUsedAt.getTime() + 24 * 60 * 60 * 1000);
          if (cooldownEnd > now) {
            calculatedStatus = "cooldown";
            timeRemaining = Math.floor((cooldownEnd.getTime() - now.getTime()) / 1000);
          }
        }
        
        return {
          ...num,
          calculatedStatus,
          timeRemaining,
          isSensitive: num.isSensitive === 1,
        };
      });
    }),
    
    // Obtém sugestão inteligente dos próximos 2 números
    getSuggestion: publicProcedure.query(async () => {
      const { getAllWhatsappNumbers } = await import("./db");
      const numbers = await getAllWhatsappNumbers();
      const now = new Date();
      
      const available = numbers.filter(num => {
        if (num.blockedUntil && num.blockedUntil > now) return false;
        if (num.lastUsedAt) {
          const cooldownEnd = new Date(num.lastUsedAt.getTime() + 24 * 60 * 60 * 1000);
          if (cooldownEnd > now) return false;
        }
        return true;
      });
      
      if (available.length === 0) return [];
      
      // Prioriza números que nunca foram usados ou há mais tempo sem uso
      available.sort((a, b) => {
        if (!a.lastUsedAt && !b.lastUsedAt) return 0;
        if (!a.lastUsedAt) return -1;
        if (!b.lastUsedAt) return 1;
        return a.lastUsedAt.getTime() - b.lastUsedAt.getTime();
      });
      
      // Retorna os 2 primeiros números disponíveis
      return available.slice(0, 2);
    }),
    
    // Registra uso de um número
    useNumber: publicProcedure
      .input(z.object({
        id: z.number(),
        contactCount: z.number().default(45),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getWhatsappNumberById, updateWhatsappNumber, insertUsageHistory } = await import("./db");
        
        const number = await getWhatsappNumberById(input.id);
        if (!number) throw new Error("Número não encontrado");
        
        const now = new Date();
        
        // Atualiza o número
        await updateWhatsappNumber(input.id, {
          lastUsedAt: now,
          lastContactCount: input.contactCount,
          status: "cooldown",
        });
        
        // Registra no histórico
        await insertUsageHistory({
          numberId: number.id,
          phoneNumber: number.phoneNumber,
          contactCount: input.contactCount,
          notes: input.notes,
        });
        
        return { success: true };
      }),
    
    // Bloqueia manualmente um número
    blockNumber: publicProcedure
      .input(z.object({
        id: z.number(),
        hours: z.number().min(1).max(168), // Máximo 7 dias
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateWhatsappNumber, insertUsageHistory, getWhatsappNumberById } = await import("./db");
        const number = await getWhatsappNumberById(input.id);
        if (!number) throw new Error("Número não encontrado");
        
        const blockedUntil = new Date(Date.now() + input.hours * 60 * 60 * 1000);
        
        await updateWhatsappNumber(input.id, {
          blockedUntil,
          isSensitive: 1,
        });
        
        await insertUsageHistory({
          numberId: input.id,
          phoneNumber: number.phoneNumber,
          contactCount: 0,
          notes: input.notes || `Bloqueado manualmente por ${input.hours}h`,
          wasBlocked: 1,
        });
        
        return { success: true };
      }),
    
    // Desbloqueia um número
    unblockNumber: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { unblockWhatsappNumber } = await import("./db");
        await unblockWhatsappNumber(input.id);
        return { success: true };
      }),
    
    // Exclui um número
    deleteNumber: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { deleteWhatsappNumber } = await import("./db");
        await deleteWhatsappNumber(input.id);
        return { success: true };
      }),
    
    // Adiciona um novo número
    addNumber: publicProcedure
      .input(z.object({
        phoneNumber: z.string().min(10),
        displayName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { addWhatsappNumber } = await import("./db");
        await addWhatsappNumber(input.phoneNumber, input.displayName);
        return { success: true };
      }),
    
    // Obtém histórico de uso
    getHistory: publicProcedure
      .input(z.object({
        limit: z.number().default(100),
      }))
      .query(async ({ input }) => {
        const { getUsageHistory } = await import("./db");
        return getUsageHistory(input.limit);
      }),
    
    // Exclui um registro individual do histórico
    deleteHistoryEntry: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { deleteHistoryEntry } = await import("./db");
        await deleteHistoryEntry(input.id);
        return { success: true };
      }),
    
    // Limpa todo o histórico
    clearHistory: publicProcedure
      .mutation(async () => {
        const { clearAllHistory } = await import("./db");
        await clearAllHistory();
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
