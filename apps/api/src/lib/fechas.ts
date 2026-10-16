// Día en Argentina como 'AAAA-MM-DD'. En UTC, de noche ya sería mañana.
export const diaEnArgentina = (fecha: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(fecha);

export const hoy = () => diaEnArgentina(new Date());
