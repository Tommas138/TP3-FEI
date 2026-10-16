import type { InscripcionesDelTorneo } from '@setpoint/shared';
import { pedir } from '../../lib/api';

// El id es el de un torneo (una categoría), no el de la convocatoria: cada categoría cierra aparte.
const ruta = (slug: string, id: number) => `/api/organizaciones/${slug}/torneos/${id}/inscripciones`;

export function obtenerInscripciones(slug: string, id: number) {
  return pedir<InscripcionesDelTorneo>('GET', ruta(slug, id));
}

export function cerrarInscripcion(slug: string, id: number) {
  return pedir<InscripcionesDelTorneo>('POST', `${ruta(slug, id)}/cerrar`);
}
