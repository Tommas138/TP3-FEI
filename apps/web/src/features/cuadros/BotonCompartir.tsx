import { useEffect, useState } from 'react';
import { Boton } from '../../components/Boton';

// Comparte el enlace de la página: en el celular abre el menú del sistema (WhatsApp, entre otros);
// donde no lo hay, copia el enlace.
export function BotonCompartir({ titulo }: { titulo: string }) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const espera = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(espera);
  }, [copiado]);

  async function compartir() {
    const url = window.location.href;
    if (navigator.share) {
      // Si la persona cierra el menú sin elegir, el navegador rechaza la promesa: no es un error.
      await navigator.share({ title: titulo, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
    } catch {
      // Sin permiso para el portapapeles no hay nada más que hacer: el enlace sigue en la barra.
    }
  }

  return (
    <Boton onClick={compartir} className="h-9 text-sm">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
        <path d="M12 3v13M8 7l4-4 4 4" />
      </svg>
      <span aria-live="polite">{copiado ? 'Enlace copiado' : 'Compartir'}</span>
    </Boton>
  );
}
