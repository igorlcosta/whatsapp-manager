import { describe, it, expect } from "vitest";

// Importar as funções utilitárias
function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatBRPhone(raw: string) {
  let d = onlyDigits(raw);

  // se começar com 55 e tiver mais que 11 dígitos, assume DDI
  const hasDDI = d.startsWith("55") && d.length > 11;
  if (hasDDI) d = d.slice(2); // remove 55 pra formatar (mantemos no display)

  // limita no máximo 11 dígitos (DDD + número)
  d = d.slice(0, 11);

  const ddd = d.slice(0, 2);
  const rest = d.slice(2);

  // celular (9 dígitos) ou fixo (8 dígitos)
  const isMobile = rest.length > 8;
  const part1 = isMobile ? rest.slice(0, 5) : rest.slice(0, 4);
  const part2 = isMobile ? rest.slice(5, 9) : rest.slice(4, 8);

  let formatted = "";
  if (ddd) formatted += `(${ddd})`;
  if (part1) formatted += ` ${part1}`;
  if (part2) formatted += `-${part2}`;

  return hasDDI ? `+55 ${formatted}` : formatted;
}

function normalizeE164BR(raw: string) {
  let d = onlyDigits(raw);
  if (!d.startsWith("55")) d = "55" + d;   // força BR
  d = d.slice(0, 13); // 55 + DDD + 9 dígitos
  return "+" + d;     // E.164: +5522999992039
}

describe("Formatação de telefone brasileiro", () => {
  describe("onlyDigits", () => {
    it("deve remover todos os caracteres não numéricos", () => {
      expect(onlyDigits("+55 (11) 98765-4321")).toBe("5511987654321");
      expect(onlyDigits("abc123def456")).toBe("123456");
      expect(onlyDigits("(22) 99999-2039")).toBe("22999992039");
    });

    it("deve retornar string vazia se não houver dígitos", () => {
      expect(onlyDigits("abc")).toBe("");
      expect(onlyDigits("()- ")).toBe("");
    });
  });

  describe("formatBRPhone", () => {
    it("deve formatar celular com DDI completo", () => {
      expect(formatBRPhone("5511987654321")).toBe("+55 (11) 98765-4321");
      expect(formatBRPhone("5522999992039")).toBe("+55 (22) 99999-2039");
    });

    it("deve formatar celular sem DDI", () => {
      expect(formatBRPhone("11987654321")).toBe("(11) 98765-4321");
      expect(formatBRPhone("22999992039")).toBe("(22) 99999-2039");
    });

    it("deve formatar telefone fixo com DDI", () => {
      expect(formatBRPhone("551199992039")).toBe("+55 (11) 9999-2039");
      expect(formatBRPhone("552299992039")).toBe("+55 (22) 9999-2039");
    });

    it("deve formatar telefone fixo sem DDI", () => {
      expect(formatBRPhone("1199992039")).toBe("(11) 9999-2039");
      expect(formatBRPhone("2299992039")).toBe("(22) 9999-2039");
    });

    it("deve formatar parcialmente números incompletos", () => {
      expect(formatBRPhone("11")).toBe("(11)");
      expect(formatBRPhone("119")).toBe("(11) 9");
      // Quando tem 7 dígitos (DDD + 5), a função já adiciona o hífen
      expect(formatBRPhone("1198765")).toBe("(11) 9876-5");
    });

    it("deve remover caracteres não numéricos antes de formatar", () => {
      expect(formatBRPhone("+55 (11) 98765-4321")).toBe("+55 (11) 98765-4321");
      expect(formatBRPhone("(11) 98765-4321")).toBe("(11) 98765-4321");
    });

    it("deve limitar a 13 dígitos (DDI + DDD + 9 dígitos)", () => {
      expect(formatBRPhone("551198765432199999")).toBe("+55 (11) 98765-4321");
    });
  });

  describe("normalizeE164BR", () => {
    it("deve normalizar para formato E.164 com DDI", () => {
      expect(normalizeE164BR("11987654321")).toBe("+5511987654321");
      expect(normalizeE164BR("22999992039")).toBe("+5522999992039");
    });

    it("deve manter DDI se já presente", () => {
      expect(normalizeE164BR("5511987654321")).toBe("+5511987654321");
      expect(normalizeE164BR("+5511987654321")).toBe("+5511987654321");
    });

    it("deve remover formatação e normalizar", () => {
      expect(normalizeE164BR("+55 (11) 98765-4321")).toBe("+5511987654321");
      expect(normalizeE164BR("(22) 99999-2039")).toBe("+5522999992039");
    });

    it("deve limitar a 13 dígitos", () => {
      expect(normalizeE164BR("551198765432199999")).toBe("+5511987654321");
    });
  });

  describe("Validação de números completos", () => {
    it("deve identificar números válidos de celular", () => {
      const validatePhone = (raw: string) => {
        const digits = onlyDigits(raw);
        const withoutDDI = digits.startsWith("55") ? digits.slice(2) : digits;
        return withoutDDI.length === 10 || withoutDDI.length === 11;
      };

      expect(validatePhone("11987654321")).toBe(true); // 11 dígitos
      expect(validatePhone("5511987654321")).toBe(true); // com DDI
      expect(validatePhone("+55 (11) 98765-4321")).toBe(true); // formatado
    });

    it("deve identificar números válidos de fixo", () => {
      const validatePhone = (raw: string) => {
        const digits = onlyDigits(raw);
        const withoutDDI = digits.startsWith("55") ? digits.slice(2) : digits;
        return withoutDDI.length === 10 || withoutDDI.length === 11;
      };

      expect(validatePhone("1199992039")).toBe(true); // 10 dígitos
      expect(validatePhone("551199992039")).toBe(true); // com DDI
      expect(validatePhone("+55 (11) 9999-2039")).toBe(true); // formatado
    });

    it("deve rejeitar números incompletos", () => {
      const validatePhone = (raw: string) => {
        const digits = onlyDigits(raw);
        const withoutDDI = digits.startsWith("55") ? digits.slice(2) : digits;
        return withoutDDI.length === 10 || withoutDDI.length === 11;
      };

      expect(validatePhone("119")).toBe(false); // muito curto
      expect(validatePhone("11987")).toBe(false); // incompleto
      expect(validatePhone("")).toBe(false); // vazio
    });
  });
});
