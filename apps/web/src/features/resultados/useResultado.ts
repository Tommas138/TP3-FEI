import type { DatosResultado } from '@setpoint/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { guardarResultado, obtenerPartido, obtenerPartidos, simularResultado } from './api';

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

// El valor recién cuando deja de cambiar por un rato. Se compara por contenido: un objeto
// nuevo con lo mismo no vuelve a esperar.
function useDemorado<T>(valor: T, ms: number) {
  const actual = JSON.stringify(valor);
  const [demorado, setDemorado] = useState(actual);
  useEffect(() => {
    const espera = setTimeout(() => setDemorado(actual), ms);
    return () => clearTimeout(espera);
  }, [actual, ms]);
  return { valor: useMemo(() => JSON.parse(demorado) as T, [demorado]), alDia: demorado === actual };
}

// La vista previa de un resultado (decisión 032): se pide cuando la grilla deja de cambiar, y
// solo si forma un resultado válido. Mientras llega la nueva, se sigue viendo la anterior.
export function useSimulacion(slug: string, id: number, partidoId: number, datos: DatosResultado | null) {
  const demorado = useDemorado(datos, 350);
  const simulacion = useQuery({
    queryKey: [...clavePartido(slug, id, partidoId), 'simulacion', demorado.valor],
    queryFn: () => simularResultado(slug, id, partidoId, demorado.valor!),
    enabled: demorado.valor !== null,
    placeholderData: keepPreviousData,
    retry: false,
  });
  return {
    data: simulacion.data,
    error: simulacion.error,
    // Lo que se ve todavía no es lo que está escrito: la grilla cambió o la respuesta no llegó.
    desactualizada: !demorado.alDia || simulacion.isPlaceholderData,
  };
}

export function useGuardarResultado(slug: string, id: number, partidoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosResultado) => guardarResultado(slug, id, partidoId, datos),
    onSuccess: (partido) => {
      queryClient.setQueryData(clavePartido(slug, id, partidoId), partido);
      // Cambian la lista, la vista previa y, en un cuadro, el partido siguiente, que tiene un jugador nuevo.
      void queryClient.invalidateQueries({ queryKey: clavePartidos(slug, id) });
    },
  });
}
