import type { DatosIngreso, RespuestaIngresoJugador } from '@setpoint/shared';
import { useMutation } from '@tanstack/react-query';
import { pedir } from '../../lib/api';
import { useSesion } from './SesionProvider';

export function useIngreso() {
  const { ingresar } = useSesion();

  return useMutation({
    mutationFn: (datos: DatosIngreso) => pedir<RespuestaIngresoJugador>('POST', '/api/auth/ingreso-jugador', datos),
    // Al guardar la sesión, la navegación lleva sola al inicio o a elegir el circuito.
    onSuccess: ingresar,
  });
}
