import type { RespuestaMisPartidos } from '@setpoint/shared';
import { useQuery } from '@tanstack/react-query';
import { pedir } from '../../lib/api';
import { useSesion } from '../auth/SesionProvider';

// Los partidos del jugador en el circuito elegido. Pide login (decisión 044).
export function useMisPartidos() {
  const { sesion, perfil } = useSesion();
  const slug = perfil?.organizacion.slug ?? '';

  return useQuery({
    queryKey: ['mis-partidos', slug],
    queryFn: () => pedir<RespuestaMisPartidos>('GET', `/api/jugador/${slug}/partidos`, undefined, sesion?.token),
    enabled: slug !== '',
    retry: 1,
  });
}
