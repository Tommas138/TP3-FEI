import type { Cuadros } from '@setpoint/shared';
import { useQuery } from '@tanstack/react-query';
import { pedir } from '../../lib/api';

// Sin login: la ruta es pública y no hace falta sesión (F10).
export function useCuadrosPublicos(slug: string, torneoId: string) {
  return useQuery({
    queryKey: ['cuadros-publicos', slug, torneoId],
    queryFn: () => pedir<Cuadros>('GET', `/api/publico/${slug}/torneos/${torneoId}/cuadros`),
    retry: false,
  });
}
