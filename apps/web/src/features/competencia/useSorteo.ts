import type { DatosSortearEntrada, Sorteo } from '@setpoint/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { confirmarSorteo, obtenerSorteo, sortear } from './api';

const claveSorteo = (slug: string, id: number) => ['sorteo', slug, id];

export function useSorteo(slug: string, id: number) {
  return useQuery({
    queryKey: claveSorteo(slug, id),
    queryFn: () => obtenerSorteo(slug, id),
    retry: false,
  });
}

// Las dos acciones devuelven el sorteo como quedó: se guarda directo en la caché.
function useGuardarEnCache(slug: string, id: number) {
  const queryClient = useQueryClient();
  return (sorteo: Sorteo) => queryClient.setQueryData(claveSorteo(slug, id), sorteo);
}

export function useSortear(slug: string, id: number) {
  const guardar = useGuardarEnCache(slug, id);
  return useMutation({
    mutationFn: (datos: DatosSortearEntrada) => sortear(slug, id, datos),
    onSuccess: guardar,
  });
}

export function useConfirmarSorteo(slug: string, id: number) {
  const queryClient = useQueryClient();
  const guardar = useGuardarEnCache(slug, id);
  return useMutation({
    mutationFn: () => confirmarSorteo(slug, id),
    onSuccess: (sorteo) => {
      guardar(sorteo);
      // El torneo cambió de estado: el listado del inicio tiene que enterarse.
      void queryClient.invalidateQueries({ queryKey: ['torneos', slug] });
    },
  });
}
