// Fechas cortas como las de las pantallas de referencia: "sáb 14", "sáb 14 · 10:00". A mano y no
// con Intl, para no depender de los datos de idioma que traiga el motor de JavaScript del celular.
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

const dosCifras = (n: number) => String(n).padStart(2, '0');

export function diaCorto(iso: string) {
  const fecha = new Date(iso);
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()}`;
}

export function diaYHora(iso: string) {
  const fecha = new Date(iso);
  return `${diaCorto(iso)} · ${dosCifras(fecha.getHours())}:${dosCifras(fecha.getMinutes())}`;
}

// Días enteros que faltan hasta la fecha, contando hoy como 0. Negativo si ya pasó.
export function diasHasta(iso: string, ahora = new Date()) {
  const inicio = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((inicio(new Date(iso)) - inicio(ahora)) / 86_400_000);
}
