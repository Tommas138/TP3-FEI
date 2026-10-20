import type { RespuestaMiZona } from '@setpoint/shared';
import { useQuery } from '@tanstack/react-query';
import { pedir } from '../../lib/api';
import { useSesion } from '../auth/SesionProvider';

// La zona del jugador en el circuito elegido. Pide login (decisión 044); cambiar de circuito
// cambia la clave y se pide de nuevo.
export function useMiZona() {
  const { sesion, perfil } = useSesion();
  const slug = perfil?.organizacion.slug ?? '';

  return useQuery({
    queryKey: ['mi-zona', slug],
    queryFn: () => pedir<RespuestaMiZona>('GET', `/api/jugador/${slug}/zona`, undefined, sesion?.token),
    enabled: slug !== '',
    retry: 1,
  });
}
