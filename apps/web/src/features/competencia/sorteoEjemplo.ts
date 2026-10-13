// Los tipos de la pantalla Sorteo de zonas y datos de ejemplo para verla completa.
// Todavía no hay endpoint de sorteo: cuando exista, las zonas salen de la API y el ejemplo se borra.
// Todos los nombres de personas son ficticios.

export type ModoDistribucion = 'serpentina' | 'directa' | 'bombos';
export type ModoSorteo = 'automatico' | 'asistido' | 'manual';

export type IntegranteDeZona = {
  // Lugar en el ranking al momento del sorteo: 1 es el mejor sembrado.
  posicionSiembra: number;
  apellido: string;
};

export type ZonaSorteada = {
  grupo: string; // "A", "B"...
  integrantes: IntegranteDeZona[];
};

export type Sorteo = {
  edicion: string;
  plazoGruposDias: number;
  // Cómo quedarían las zonas con cada forma de repartir.
  zonas: Record<ModoDistribucion, ZonaSorteada[]>;
};

// La suma de las posiciones de siembra: si todas las zonas dan lo mismo, quedaron parejas.
export function sumaDeSiembra(zona: ZonaSorteada) {
  return zona.integrantes.reduce((total, integrante) => total + integrante.posicionSiembra, 0);
}

// En orden de siembra: el primero es el 1 del ranking.
const apellidos = [
  'Antileo', 'Roa', 'Sosa', 'Painefil', 'Sanhueza', 'Bustos', 'Curihual', 'Cabrera',
  'Aguirre', 'Domínguez', 'Ferreyra', 'Ledesma', 'Nieva', 'Sepúlveda', 'Peralta', 'Vera',
  'Quilodrán', 'Millán', 'Cárdenas', 'Ojeda', 'Riquelme', 'Barría', 'Huenchul', 'Salgado',
  'Lagos', 'Contreras', 'Rivas', 'Muñoz', 'Godoy', 'Paillalef', 'Arriagada', 'Zúñiga',
];

// Cada fila es una zona, de la A a la H, con las posiciones de siembra que le tocan.
function zonas(posiciones: number[][]): ZonaSorteada[] {
  return posiciones.map((deLaZona, i) => ({
    grupo: 'ABCDEFGH'[i],
    integrantes: deLaZona.map((posicionSiembra) => ({ posicionSiembra, apellido: apellidos[posicionSiembra - 1] })),
  }));
}

export const sorteoEjemplo: Sorteo = {
  edicion: 'Primavera 26 · Tercera',
  plazoGruposDias: 21,
  zonas: {
    serpentina: zonas([
      [1, 16, 17, 32],
      [2, 15, 18, 31],
      [3, 14, 19, 30],
      [4, 13, 20, 29],
      [5, 12, 21, 28],
      [6, 11, 22, 27],
      [7, 10, 23, 26],
      [8, 9, 24, 25],
    ]),
    directa: zonas([
      [1, 9, 17, 25],
      [2, 10, 18, 26],
      [3, 11, 19, 27],
      [4, 12, 20, 28],
      [5, 13, 21, 29],
      [6, 14, 22, 30],
      [7, 15, 23, 31],
      [8, 16, 24, 32],
    ]),
    // Un resultado posible: al azar dentro de cada franja de 8.
    bombos: zonas([
      [3, 12, 22, 27],
      [7, 9, 18, 32],
      [1, 15, 24, 25],
      [8, 10, 17, 30],
      [5, 16, 20, 26],
      [2, 13, 23, 29],
      [6, 11, 19, 31],
      [4, 14, 21, 28],
    ]),
  },
};
