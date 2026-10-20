// Mismo contrato que apps/web/src/lib/api.ts. Cambia la base: en el celular no hay proxy de Vite,
// así que cada pedido va a la URL completa de la API.

// Se lee con punto: Expo reemplaza process.env.EXPO_PUBLIC_* al compilar, y solo en esta forma.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Un pedido a una IP que no contesta tarda mucho en fallar solo; mejor cortarlo y decirlo.
const ESPERA_MAXIMA_MS = 10_000;

export class ErrorApi extends Error {
  codigo: string;
  campos: Record<string, string>;

  constructor(codigo: string, campos: Record<string, string> = {}) {
    super(codigo);
    this.codigo = codigo;
    this.campos = campos;
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export function urlDeLaApi(): string | undefined {
  return API_URL;
}

// Llama a la API. Los errores llegan como ErrorApi con el código de la API. Las rutas de
// /api/jugador piden el token de la sesión; las públicas, no.
export async function pedir<T>(metodo: Metodo, ruta: string, cuerpo?: unknown, token?: string): Promise<T> {
  if (!API_URL) throw new ErrorApi('SIN_API_URL');

  const corte = new AbortController();
  const temporizador = setTimeout(() => corte.abort(), ESPERA_MAXIMA_MS);
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: {
        ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: corte.signal,
    });
  } catch {
    throw new ErrorApi('SIN_CONEXION');
  } finally {
    clearTimeout(temporizador);
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new ErrorApi(datos?.error ?? 'ERROR_INTERNO', datos?.campos);
  return datos as T;
}
