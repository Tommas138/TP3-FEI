import type { DatosResultado, PartidoConResultado, PartidosDelTorneo, SimulacionDeResultado } from '@setpoint/shared';
import { pedir } from '../../lib/api';

// El id es el de un torneo (una categoría): cada categoría tiene sus zonas y sus cuadros.
const ruta = (slug: string, id: number) => `/api/organizaciones/${slug}/torneos/${id}/partidos`;

export function obtenerPartidos(slug: string, id: number) {
  return pedir<PartidosDelTorneo>('GET', ruta(slug, id));
}

export function obtenerPartido(slug: string, id: number, partidoId: number) {
  return pedir<PartidoConResultado>('GET', `${ruta(slug, id)}/${partidoId}`);
}

// Cargar y corregir es lo mismo: el resultado nuevo reemplaza al que haya (decisión 028).
export function guardarResultado(slug: string, id: number, partidoId: number, datos: DatosResultado) {
  return pedir<PartidoConResultado>('PUT', `${ruta(slug, id)}/${partidoId}/resultado`, datos);
}

// Cómo quedaría la zona con ese resultado, sin guardarlo (decisión 032).
export function simularResultado(slug: string, id: number, partidoId: number, datos: DatosResultado) {
  return pedir<SimulacionDeResultado>('POST', `${ruta(slug, id)}/${partidoId}/simulacion`, datos);
}
