/** Fecha de hoy en formato YYYY-MM-DD */
export function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Dado un mes en formato 'YYYY-MM' (o vacío = mes actual), devuelve el
 * primer y último día de ese mes en formato 'YYYY-MM-DD', listos para
 * usarse con el operador `Between` de TypeORM.
 */
export function rangoDelMes(mes?: string): { desde: string; hasta: string } {
  const base = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : hoyIso().slice(0, 7);
  const [anio, mesNum] = base.split('-').map(Number);

  const desde = `${base}-01`;
  // Día 0 del mes siguiente = último día del mes actual
  const ultimoDia = new Date(anio, mesNum, 0).getDate();
  const hasta = `${base}-${String(ultimoDia).padStart(2, '0')}`;

  return { desde, hasta };
}
