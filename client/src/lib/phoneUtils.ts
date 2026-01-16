/**
 * Utilitários para formatação e validação de telefones brasileiros
 */

/**
 * Remove tudo exceto dígitos de uma string
 * @example onlyDigits("+55 (14) 98225-0395") → "5514982250395"
 */
export function onlyDigits(str: string): string {
  return str.replace(/\D/g, "");
}

/**
 * Normaliza número brasileiro para formato E.164 (apenas dígitos com +55)
 * @example normalizeE164BR("+55 (14) 98225-0395") → "5514982250395"
 * @example normalizeE164BR("14982250395") → "5514982250395"
 */
export function normalizeE164BR(phone: string): string {
  const digits = onlyDigits(phone);
  // Se já começa com 55, retorna como está
  if (digits.startsWith("55")) {
    return digits;
  }
  // Caso contrário, adiciona 55 no início
  return "55" + digits;
}

/**
 * Formata número brasileiro para exibição visual
 * @example formatBRPhone("5514982250395") → "+55 (14) 98225-0395"
 * @example formatBRPhone("5522999920399") → "+55 (22) 99999-2039"
 * @example formatBRPhone("551499992039") → "+55 (14) 9999-2039"
 */
export function formatBRPhone(phone: string): string {
  const digits = onlyDigits(phone);
  
  // Remove o prefixo 55 se existir
  const withoutCountry = digits.startsWith("55") ? digits.slice(2) : digits;
  
  // Precisa ter pelo menos DDD (2 dígitos)
  if (withoutCountry.length < 2) {
    return "+55 " + withoutCountry;
  }
  
  const ddd = withoutCountry.slice(0, 2);
  const number = withoutCountry.slice(2);
  
  // Sem número após DDD
  if (number.length === 0) {
    return `+55 (${ddd}) `;
  }
  
  // Número com 9 dígitos (celular): XXXXX-XXXX
  if (number.length > 5) {
    const part1 = number.slice(0, 5);
    const part2 = number.slice(5, 9); // Limita a 4 dígitos finais
    return `+55 (${ddd}) ${part1}-${part2}`;
  }
  
  // Número com 5 dígitos ou menos (ainda digitando)
  if (number.length <= 5) {
    return `+55 (${ddd}) ${number}`;
  }
  
  // Número com 8 dígitos (fixo): XXXX-XXXX
  const part1 = number.slice(0, 4);
  const part2 = number.slice(4, 8); // Limita a 4 dígitos finais
  return `+55 (${ddd}) ${part1}-${part2}`;
}

/**
 * Valida se o número brasileiro está completo e válido
 * @returns true se válido, false caso contrário
 */
export function isValidBRPhone(phone: string): boolean {
  const digits = onlyDigits(phone);
  const withoutCountry = digits.startsWith("55") ? digits.slice(2) : digits;
  
  // Deve ter DDD (2) + número (8 ou 9 dígitos) = 10 ou 11 dígitos
  return withoutCountry.length === 10 || withoutCountry.length === 11;
}
