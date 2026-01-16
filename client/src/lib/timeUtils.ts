/**
 * Formata um timestamp para tempo relativo em português
 * Ex: "há 2 horas", "há 3 dias", "há 1 minuto"
 */
export function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return "Nunca usado";

  const now = Date.now();
  const diff = now - timestamp;

  // Converter para diferentes unidades
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Formatar baseado na unidade mais apropriada
  if (days > 0) {
    return `há ${days} ${days === 1 ? "dia" : "dias"}`;
  } else if (hours > 0) {
    return `há ${hours} ${hours === 1 ? "hora" : "horas"}`;
  } else if (minutes > 0) {
    return `há ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  } else {
    return "há poucos segundos";
  }
}
