/**
 * Standardized metric formatting for Otarosta
 */

export function formatBlockHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  if (hours > 999) {
    return (hours / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return hours.toLocaleString();
}

export function formatKilometers(km: number): string {
  if (km >= 1000000) {
    return (km / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (km >= 1000) {
    return (km / 1000).toFixed(0) + 'k';
  }
  return km.toLocaleString();
}

export function formatVisitCount(count: number): string {
  if (count === 1) return '1 visit';
  return `${count.toLocaleString()} visits`;
}
