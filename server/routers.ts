import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

// Função auxiliar para calcular status de um número
// Reutilizável entre listNumbers e getSuggestion
function getNumberStatus(num: any, now: Date): { status: "available" | "cooldown" | "blocked"; timeRemaining: number } {
  // Verifica se está bloqueado manualmente
  if (num.blockedUntil && num.blockedUntil > now) {
    return {
      status: "blocked",
      timeRemaining: Math.floor((num.blockedUntil.getTime() - now.getTime()) / 1000)
    };
  }
  
  // Verifica cooldown de 24h
  if (num.lastUsedAt) {
    const cooldownEnd = new Date(num.lastUsedAt.getTime() + 24 * 60 * 60 * 1000);
    if (cooldownEnd > now) {
      return {
        status: "cooldown",
        timeRemaining: Math.floor((cooldownEnd.getTime() - now.getTime()) / 1000)
      };
    }
  }
  
  return { status: "available", timeRemaining: 0 };
}

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
        const { status, timeRemaining } = getNumberStatus(num, now);
        
        return {
          ...num,
          calculatedStatus: status,
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
      
      // Filtra apenas números disponíveis usando função reutilizável
      const available = numbers.filter(num => {
        const { status } = getNumberStatus(num, now);
        return status === "available";
      });
      
      if (available.length === 0) return [];
      
      // Ordena com tie-breakers:
      // 1. Nunca usado (prioridade máxima)
      // 2. Há mais tempo sem uso (lastUsedAt mais antigo)
      // 3. Menos usado no total (totalUseCount menor)
      // 4. ID menor (desempate final)
      available.sort((a, b) => {
        // Critério 1: Nunca usado tem prioridade
        if (!a.lastUsedAt && !b.lastUsedAt) {
          // Ambos nunca usados, vai para critério 3
          if (a.totalUseCount !== b.totalUseCount) {
            return a.totalUseCount - b.totalUseCount;
          }
          return a.id - b.id; // Critério 4
        }
        if (!a.lastUsedAt) return -1;
        if (!b.lastUsedAt) return 1;
        
        // Critério 2: Há mais tempo sem uso
        const timeDiff = a.lastUsedAt.getTime() - b.lastUsedAt.getTime();
        if (timeDiff !== 0) return timeDiff;
        
        // Critério 3: Menos usado no total
        if (a.totalUseCount !== b.totalUseCount) {
          return a.totalUseCount - b.totalUseCount;
        }
        
        // Critério 4: ID menor (desempate final)
        return a.id - b.id;
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
          totalUseCount: (number.totalUseCount || 0) + 1, // Incrementa contador
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
        phoneNumber: z.string()
          .min(10, "Número muito curto")
          .regex(/^\+?[0-9\s\-\(\)]+$/, "Formato inválido. Use apenas números, +, -, ( ) e espaços")
          .refine(val => {
            // Remove caracteres não numéricos para contar dígitos
            const digits = val.replace(/\D/g, '');
            return digits.length >= 10 && digits.length <= 15;
          }, "Número deve ter entre 10 e 15 dígitos"),
        displayName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { addWhatsappNumber, getAllWhatsappNumbers } = await import("./db");
        
        // Verifica duplicatas
        const existing = await getAllWhatsappNumbers();
        const normalized = input.phoneNumber.replace(/\D/g, '');
        const isDuplicate = existing.some(n => n.phoneNumber.replace(/\D/g, '') === normalized);
        
        if (isDuplicate) {
          throw new Error("Este número já está cadastrado");
        }
        
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
