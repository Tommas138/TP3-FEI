import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cerrarInscripcion, obtenerInscripciones } from './api';

const claveInscripciones = (slug: string, id: number) => ['inscripciones', slug, id];

export function useInscripciones(slug: string, id: number) {
  return useQuery({
    queryKey: claveInscripciones(slug, id),
    queryFn: () => obtenerInscripciones(slug, id),
    retry: false,
  });
}

export function useCerrarInscripcion(slug: string, id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cerrarInscripcion(slug, id),
    onSuccess: (inscripciones) => {
      // Devuelve las inscripciones como quedaron: se guardan directo en la caché.
      queryClient.setQueryData(claveInscripciones(slug, id), inscripciones);
      // El torneo cambió de estado: el inicio y el sorteo tienen que enterarse.
      void queryClient.invalidateQueries({ queryKey: ['torneos', slug] });
      void queryClient.invalidateQueries({ queryKey: ['sorteo', slug, id] });
    },
    // Si falló, puede que otro la haya cerrado o que haya cambiado quién pagó: se vuelve a pedir.
    onError: () => void queryClient.invalidateQueries({ queryKey: claveInscripciones(slug, id) }),
  });
}
