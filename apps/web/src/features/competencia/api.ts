import type { DatosSortearEntrada, Sorteo } from '@setpoint/shared';
import { pedir } from '../../lib/api';

// El id es el de un torneo (una categoría), no el de la convocatoria: cada categoría se sortea aparte.
const ruta = (slug: string, id: number) => `/api/organizaciones/${slug}/torneos/${id}/sorteo`;

export function obtenerSorteo(slug: string, id: number) {
  return pedir<Sorteo>('GET', ruta(slug, id));
}

export function sortear(slug: string, id: number, datos: DatosSortearEntrada) {
  return pedir<Sorteo>('POST', ruta(slug, id), datos);
}

export function confirmarSorteo(slug: string, id: number) {
  return pedir<Sorteo>('POST', `${ruta(slug, id)}/confirmar`);
}
