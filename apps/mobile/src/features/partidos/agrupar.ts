import type { PartidoDelJugador } from '@setpoint/shared';
import { diasHasta } from '../../lib/fechas';

export type PartidosAgrupados = {
  // El primero con fecha acordada desde hoy: va en la tarjeta negra.
  proximo: PartidoDelJugador | null;
  // Sin fecha y con rival, del que vence antes al que vence después.
  sinCoordinar: PartidoDelJugador[];
  // Lo demás: los que tienen fecha después del próximo y los jugados, más reciente arriba.
  resto: PartidoDelJugador[];
  // Los que tienen rival: de un cuadro que todavía no se definió no se sabe contra quién.
  conRival: number;
};

const porFecha = (campo: 'fechaAcordada' | 'fechaLimite') => (a: PartidoDelJugador, b: PartidoDelJugador) =>
  (a[campo] ?? '9999').localeCompare(b[campo] ?? '9999');

// Cómo se reparte Cuándo juego (04-flujo-jugador §7): próximo partido, lo que falta coordinar
// con su plazo, y el resto del torneo.
export function agruparPartidos(partidos: PartidoDelJugador[], ahora = new Date()): PartidosAgrupados {
  const conRival = partidos.filter((p) => p.rival !== null);
  const porJugar = conRival.filter((p) => p.resultado === null);

  const agendados = porJugar
    .filter((p) => p.fechaAcordada !== null && diasHasta(p.fechaAcordada, ahora) >= 0)
    .sort(porFecha('fechaAcordada'));
  // Una fecha acordada que ya pasó sin resultado: se jugó y falta cargarlo, o no se jugó.
  // Para el jugador ya no es "lo que viene"; queda con los demás.
  const pasados = porJugar.filter((p) => p.fechaAcordada !== null && diasHasta(p.fechaAcordada, ahora) < 0);
  const jugados = conRival.filter((p) => p.resultado !== null).reverse();

  return {
    proximo: agendados[0] ?? null,
    sinCoordinar: porJugar.filter((p) => p.fechaAcordada === null).sort(porFecha('fechaLimite')),
    resto: [...agendados.slice(1), ...pasados, ...jugados],
    conRival: conRival.length,
  };
}

// "https://wa.me/5492994000000". Los números del padrón se cargan sin el 54 ni el 9 de los
// celulares argentinos; si ya los traen, se dejan.
export function enlaceDeWhatsApp(telefono: string) {
  const digitos = telefono.replace(/\D/g, '').replace(/^0/, '');
  return `https://wa.me/${digitos.startsWith('54') ? digitos : `549${digitos}`}`;
}
