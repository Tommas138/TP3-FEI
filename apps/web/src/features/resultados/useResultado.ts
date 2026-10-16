import type { DatosResultado } from '@setpoint/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { guardarResultado, obtenerPartido, obtenerPartidos } from './api';

// La lista y cada partido comparten el comienzo de la clave: invalidar la lista refresca todo.
const clavePartidos = (slug: string, id: number) => ['partidos', slug, id];
const clavePartido = (slug: string, id: number, partidoId: number) => [...clavePartidos(slug, id), partidoId];

export function usePartidos(slug: string, id: number) {
  return useQuery({
    queryKey: clavePartidos(slug, id),
    queryFn: () => obtenerPartidos(slug, id),
    retry: false,
  });
}

export function usePartido(slug: string, id: number, partidoId: number) {
  return useQuery({
    queryKey: clavePartido(slug, id, partidoId),
    queryFn: () => obtenerPartido(slug, id, partidoId),
    retry: false,
  });
}

export function useGuardarResultado(slug: string, id: number, partidoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosResultado) => guardarResultado(slug, id, partidoId, datos),
    onSuccess: (partido) => {
      queryClient.setQueryData(clavePartido(slug, id, partidoId), partido);
      // Cambia la lista y, en un cuadro, el partido siguiente, que tiene un jugador nuevo.
      void queryClient.invalidateQueries({ queryKey: clavePartidos(slug, id) });
    },
  });
}
