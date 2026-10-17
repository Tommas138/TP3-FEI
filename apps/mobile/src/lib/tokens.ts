// Tokens de docs/design.md (§3 color, §4 tipografía, §5 medidas). Son los mismos valores que
// apps/web/src/index.css: si cambia uno, cambia en los dos lados (decisión 034).

export const colores = {
  lima: '#CDF546',
  limaTenue: '#F7FCE7',
  negro: '#0A0B0D',
  carbon: '#17191D',
  bordeOscuro: '#2C3037',
  gris700: '#3F4348',
  gris500: '#6A7079',
  gris400: '#9BA1A9',
  gris300: '#C9CDD3',
  linea: '#E6E8EB',
  lineaSuave: '#F1F2F4',
  fondo: '#F6F7F8',
  fondoTabla: '#FAFBFC',
  blanco: '#FFFFFF',
  rojo: '#E5484D',
  rojoTexto: '#C62A2F',
  rojoFondo: '#FEF6F6',
  rojoLinea: '#F3D3D4',
} as const;

// En Android cada peso es una familia aparte: el peso se elige con fontFamily, nunca con
// fontWeight. Los nombres son los que registra useFonts en src/app/_layout.tsx.
export const fuentes = {
  sans: {
    400: 'InstrumentSans_400Regular',
    500: 'InstrumentSans_500Medium',
    600: 'InstrumentSans_600SemiBold',
    700: 'InstrumentSans_700Bold',
  },
  mono: {
    400: 'GeistMono_400Regular',
    500: 'GeistMono_500Medium',
    600: 'GeistMono_600SemiBold',
  },
} as const;

// Todo número va en mono y con cifras de ancho fijo.
export const tabular = { fontVariant: ['tabular-nums'] } as const;

export const radios = {
  chip: 999,
  control: 10,
  tarjeta: 14,
  superficie: 18,
} as const;

export const medidas = {
  toque: 56,
  toqueSecundario: 52,
  margen: 16,
} as const;
