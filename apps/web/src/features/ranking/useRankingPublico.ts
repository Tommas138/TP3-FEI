import type { RankingPublico } from '@setpoint/shared';
import { useQuery } from '@tanstack/react-query';
import { pedir } from '../../lib/api';

// Sin login: la ruta es pública y no hace falta sesión (F09).
export function useRankingPublico(slug: string) {
  return useQuery({
    queryKey: ['ranking-publico', slug],
    queryFn: () => pedir<RankingPublico>('GET', `/api/publico/${slug}/ranking`),
    retry: false,
  });
}
