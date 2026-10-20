import type { PerfilDeJugador } from '@setpoint/shared';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { olvidarCelular } from '../avisos/avisos';
import { borrarSesion, guardarCircuito, guardarSesion, leerCircuito, leerSesion, type Sesion } from './sesion';

type ValorSesion = {
  // Mientras se lee del celular al abrir la app: la splash espera.
  cargando: boolean;
  sesion: Sesion | null;
  // El circuito en el que está: el único que tiene, o el que eligió. null si juega en varios y
  // todavía no eligió (decisión 040).
  perfil: PerfilDeJugador | null;
  ingresar: (sesion: Sesion) => Promise<void>;
  elegirCircuito: (jugadorId: number) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const ContextoSesion = createContext<ValorSesion | null>(null);

function perfilElegido(perfiles: PerfilDeJugador[], jugadorId: number | null) {
  if (perfiles.length === 1) return perfiles[0];
  return perfiles.find((p) => p.jugador.id === jugadorId) ?? null;
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [jugadorIdElegido, setJugadorIdElegido] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([leerSesion(), leerCircuito()]).then(([guardada, jugadorId]) => {
      setSesion(guardada);
      setJugadorIdElegido(jugadorId);
      setCargando(false);
    });
  }, []);

  const valor = useMemo<ValorSesion>(
    () => ({
      cargando,
      sesion,
      perfil: sesion && perfilElegido(sesion.perfiles, jugadorIdElegido),
      ingresar: async (nueva) => {
        await guardarSesion(nueva);
        setSesion(nueva);
      },
      elegirCircuito: async (jugadorId) => {
        await guardarCircuito(jugadorId);
        setJugadorIdElegido(jugadorId);
      },
      // También olvida el circuito elegido: en un celular compartido, quien entre después elige el suyo.
      cerrarSesion: async () => {
        const perfil = sesion && (perfilElegido(sesion.perfiles, jugadorIdElegido) ?? sesion.perfiles[0]);
        // Sin esperarlo: sin señal tardaría, y salir no puede depender de la red.
        if (sesion && perfil) void olvidarCelular(perfil.organizacion.slug, sesion.token);
        await borrarSesion();
        setSesion(null);
        setJugadorIdElegido(null);
      },
    }),
    [cargando, sesion, jugadorIdElegido],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion() {
  const valor = useContext(ContextoSesion);
  if (!valor) throw new Error('useSesion se usa dentro de SesionProvider');
  return valor;
}
