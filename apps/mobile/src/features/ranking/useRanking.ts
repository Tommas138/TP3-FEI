import type { RankingPublico } from '@setpoint/shared';
import { useQuery } from '@tanstack/react-query';
import { pedir } from '../../lib/api';

// La misma ruta pública que la web (decisión 033): el ranking no pide login. La sesión solo dice de
// qué circuito pedirlo y cuál es tu fila. Cambiar de circuito cambia la clave y se pide de nuevo.
export function useRanking(slug: string) {
  return useQuery({
    queryKey: ['ranking-publico', slug],
    queryFn: () => pedir<RankingPublico>('GET', `/api/publico/${slug}/ranking`),
    // Un reintento por si la señal se cortó; más, con el corte de 10 segundos de pedir(), tarda en avisar.
    retry: 1,
  });
}
