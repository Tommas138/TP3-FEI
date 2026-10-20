// Mensajes de los avisos push (F11). Lógica pura: arma qué se le dice a cada uno, sin enviar nada.

export type Aviso = { usuarioId: number; titulo: string; cuerpo: string };

type InscriptoConZona = { usuarioId: number | null; grupo: string };

// Al confirmarse el sorteo: a cada jugador con cuenta, su zona. Los que no tienen cuenta
// no tienen la app y se enteran por el grupo, como hoy.
export function avisosDeFixture(torneo: string, inscriptos: InscriptoConZona[]): Aviso[] {
  return inscriptos.flatMap(({ usuarioId, grupo }) =>
    usuarioId === null
      ? []
      : [{ usuarioId, titulo: `Ya está el fixture de ${torneo}`, cuerpo: `Te tocó la zona ${grupo}. Mirá contra quién jugás y coordiná las fechas.` }],
  );
}

type Ticket = { status: 'ok' } | { status: 'error'; details?: { error?: string } };

// Los tokens que el servicio de Expo dice que ya no sirven: la app se desinstaló o se le quitó
// el permiso. Los tickets vuelven en el mismo orden que los mensajes.
export function tokensDadosDeBaja(tokens: string[], tickets: Ticket[]): string[] {
  return tokens.filter((_, i) => {
    const ticket = tickets[i];
    return ticket?.status === 'error' && ticket.details?.error === 'DeviceNotRegistered';
  });
}
