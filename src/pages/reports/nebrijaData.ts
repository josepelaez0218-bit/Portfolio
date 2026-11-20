// Auditoría de marca de la Universidad Nebrija (20 nov 2026): the content of
// /informes/nebrija, kept apart from the layout so it reads (and edits) as text.

export const IMG = "/informes/nebrija";

export type State = "critico" | "mejorable" | "correcto";

export const STATE_LABEL: Record<State, string> = {
  critico: "Crítico",
  mejorable: "Mejorable",
  correcto: "Correcto",
};

export type Shot = { src: string; w: number; h: number; alt: string; caption: string; title: string };

const shot = (src: string, w: number, h: number, title: string, caption: string, alt = caption): Shot => ({
  src: `${IMG}/${src}.jpg`,
  w,
  h,
  alt,
  title,
  caption,
});

export const SHOTS = {
  home: shot("home", 1200, 750, "Portada", "Velo blanco sobre la foto, Roboto en los titulares y un emoji como viñeta del texto principal."),
  grado: shot("grado", 1200, 750, "Ficha de grado", "Fotografía de banco de imágenes y un verde que no pertenece a la paleta."),
  logos: shot("logos", 1704, 468, "El logotipo en cada canal", "Siete versiones, capturadas de la cabecera de cada web. Ninguna es incorrecta por sí sola; el problema es que conviven sin una regla."),
  completa: shot("home-completa", 1896, 1048, "La portada completa", "De arriba abajo, en cinco columnas: más de 25 bloques que alternan bandas rojas, negras y blancas sin un ritmo claro."),
  bandaRoja: shot("home-banda-roja", 1200, 483, "Primer bloque tras la portada", "Un párrafo institucional de cinco líneas en negrita sobre rojo, difícil de leer."),
  empleabilidad: shot("home-empleabilidad", 1200, 1083, "Empleabilidad, a unos 3.000 px", "El dato más potente de la universidad, Nº1 en inserción laboral, en texto pequeño y gris."),
  tarjetas: shot("home-tarjetas", 1200, 483, "Carrusel de destacados", "Cada tarjeta tiene su propio tratamiento de color y tipografía."),
  campus: shot("home-campus", 1200, 683, "Campus", "Buena idea de contenido; el texto blanco sobre las fotos reduce la legibilidad."),
  comunicacion: shot("home-comunicacion", 1200, 600, "Comunicación y Artes", "Otro estilo gráfico, un collage de colores, dentro de la misma página."),
  pruebas: shot("home-pruebas", 1200, 641, "Pruebas de admisión", "Títulos sobre foto en dos colores y dos pesos."),
  faq: shot("home-faq", 1200, 1083, "Preguntas frecuentes", "Seis columnas de texto continuo: útil para buscadores, poco legible para personas."),
  noticias: shot("home-noticias", 1200, 833, "Noticias", "Fondo rojo completo con fotos superpuestas; compite con el resto de bandas rojas."),
  movilHome: shot("movil-home", 600, 1298, "nebrija.com en el móvil", "La primera pantalla es casi solo texto; la llamada a la acción queda al final."),
  movilFp: shot("movil-fp", 600, 1298, "fpnebrija.com en el móvil", "Tres botones flotantes compiten con el contenido."),
  botones: shot("botones", 1086, 942, "19 estilos de botón", "Una selección de los botones reales de cada web: rectos y redondeados, rellenos, con contorno o con una línea suelta, en mayúsculas o no, con flecha o con chevron."),
  admision: shot("admision-variantes", 1449, 132, "La misma acción, cuatro botones", "«Admisión» en cuatro estilos dentro de nebrija.com. En la página de admisión, además, en inglés: «APPLY HERE»."),
  bschool: shot("bschool", 1200, 750, "Business School", "Logotipo propio en bloque rojo y cabecera negra."),
  postgrado: shot("postgrado", 1200, 750, "Postgrados", "Buscador con seis filtros. Desde esta página sale el enlace al entorno de desarrollo."),
  admisiones: shot("admisiones", 1200, 750, "Admisiones", "Aquí aparece el busto, que no está en la web desde la que se llega."),
  fp: shot("fp", 1200, 750, "Instituto FP", "Otro rojo y una estética de campaña."),
  idiomas: shot("idiomas", 1200, 750, "Lenguas Modernas", "Collage de banderas y Arial condensada."),
  competencias: shot("competencias", 1200, 750, "Competencias", "Formas diagonales que no aparecen en ninguna otra pieza."),
  actos: shot("actos", 1200, 750, "Actos", "Otra plantilla, otro buscador y otro calendario."),
  instagram: shot("instagram", 960, 1340, "Instagram", "Busto en el avatar, historias destacadas genéricas (dos vacías) y un feed de fotografía de eventos."),
  youtube: shot("youtube", 1200, 750, "YouTube", "Banner hecho con un collage de fotos y miniaturas sin plantilla común."),
  presentacion: shot("presentacion", 1467, 825, "Presentación institucional 2026", "Datos protagonistas y un rojo coherente: el nivel que debería tener toda la presencia digital."),
} satisfies Record<string, Shot>;

export const SCORE: { area: string; state: State; finding: string; to: string }[] = [
  { area: "Arquitectura de marca", state: "critico", finding: "Cada unidad tiene su web, su dominio y su estilo, sin reglas comunes.", to: "arquitectura" },
  { area: "Logotipo", state: "critico", finding: "Siete versiones distintas conviviendo.", to: "logotipo" },
  { area: "Sistema de diseño", state: "critico", finding: "61 tamaños de letra, 19 estilos de botón y 17 radios de esquina.", to: "sistema" },
  { area: "Tipografía", state: "critico", finding: "Roboto y Arial; la serifa del logotipo no se usa nunca.", to: "tipografia" },
  { area: "Mensaje y jerarquía", state: "critico", finding: "El Nº1 en inserción laboral aparece a unos 3.000 px.", to: "web" },
  { area: "Color", state: "mejorable", finding: "Ocho tonos de rojo y diecinueve grises.", to: "color" },
  { area: "Fotografía", state: "mejorable", finding: "Sin dirección de arte: velos, stock y collages.", to: "fotografia" },
  { area: "Experiencia móvil", state: "mejorable", finding: "La portada mide unas 26 pantallas de móvil.", to: "movil" },
  { area: "Calidad técnica", state: "mejorable", finding: "Imágenes sin texto alternativo, SEO irregular, portada de 17 MB.", to: "tecnica" },
  { area: "Redes sociales", state: "mejorable", finding: "Comunidad amplia, contenido sin sistema y poco alcance.", to: "redes" },
  { area: "Contenido institucional", state: "correcto", finding: "Datos sólidos y una presentación bien resuelta.", to: "fortalezas" },
];

export const FIGURES = [
  { value: "14.956", label: "estudiantes: 6.721 de grado, 8.104 de máster y 131 de doctorado" },
  { value: "+68.000", label: "antiguos alumnos" },
  { value: "94,2 %", label: "inserción laboral, Nº1 en U-Ranking 2026" },
  { value: "18,9 %", label: "estudiantes internacionales, de más de 60 países" },
  { value: "48 + 39", label: "grados y dobles grados, más 62 másteres" },
  { value: "4", label: "campus en Madrid y sedes en América, Europa y Asia" },
];

export const UNITS = [
  { unit: "Universidad Nebrija", domain: "nebrija.com", look: "Plantilla propia, Roboto", logo: "Logotipo de texto, sin busto" },
  { unit: "Business & Technology School", domain: "nebrija.com/business-school", look: "Cabecera y menú propios", logo: "Bloque rojo independiente" },
  { unit: "Instituto de Formación Profesional", domain: "fpnebrija.com", look: "Otra plantilla, Font Awesome", logo: "Busto, logotipo y descriptor" },
  { unit: "Instituto de Lenguas Modernas", domain: "idiomasnebrija.com", look: "Otra plantilla, Arial MT Pro", logo: "Busto, logotipo y descriptor" },
  { unit: "Instituto de Competencias", domain: "competenciasprofesionalesnebrija.com", look: "Otra plantilla, diagonales", logo: "Busto, logotipo y descriptor" },
  { unit: "Agenda de actos", domain: "actos.nebrija.es", look: "Otra plantilla, Glyphicons", logo: "Busto y logotipo" },
  { unit: "Portal de admisiones", domain: "admisiones.nebrija.com", look: "Plataforma externa, Arial MT Pro", logo: "Busto y logotipo" },
];

export const REDS = [
  { hex: "#B32535", where: "nebrija.com, botones y bandas" },
  { hex: "#CF1341", where: "nebrija.com, otros elementos" },
  { hex: "#C2002F", where: "FP, Idiomas, Competencias y Actos" },
];

export const TECH = [
  { page: "Portada nebrija.com", weight: "≈17 MB", reqs: 180, alt: "28 de 115", h1: "1", meta: "Sí, con emoji", buttons: 5 },
  { page: "Ficha de grado", weight: "≈1,9 MB", reqs: 171, alt: "26 de 43", h1: "1", meta: "Sí", buttons: 2 },
  { page: "Postgrados", weight: "≈2,5 MB", reqs: 142, alt: "8 de 49", h1: "1", meta: "Sí", buttons: 1 },
  { page: "Business School", weight: "≈2,6 MB", reqs: 148, alt: "12 de 99", h1: "4", meta: "No tiene", buttons: 4 },
  { page: "Instituto FP", weight: "≈4 MB", reqs: 78, alt: "0 de 78", h1: "1", meta: "Sí", buttons: 2 },
  { page: "Lenguas Modernas", weight: "≈2,4 MB", reqs: 70, alt: "9 de 21", h1: "1", meta: "Empieza a mitad de frase", buttons: 3 },
  { page: "Competencias", weight: "≈1,7 MB", reqs: 45, alt: "4 de 12", h1: "1", meta: "Sí", buttons: 3 },
  { page: "Actos", weight: "≈3,3 MB", reqs: 58, alt: "9 de 11", h1: "12", meta: "Sí", buttons: 2 },
];

export const SOCIAL = [
  { channel: "Instagram", followers: "65.100", activity: "3.827 publicaciones", note: "Feed de eventos sin cuadrícula ni plantillas; enlace a Linktree en lugar de a una página propia." },
  { channel: "Facebook", followers: "53.381", activity: "—", note: "Audiencia amplia, sin un papel distinto al de Instagram." },
  { channel: "YouTube", followers: "4.510", activity: "≈1.600 vídeos", note: "Unos 2,8 suscriptores por vídeo; el último tiene 582 visualizaciones." },
  { channel: "TikTok", followers: "5.454", activity: "81.500 «me gusta»", note: "El canal de la audiencia de grado es el más pequeño." },
];

export const PHASES = [
  { title: "Diagnóstico y estrategia", body: "Completar esta auditoría con los datos internos, hablar con los equipos de cada unidad y fijar el posicionamiento: por qué elegir Nebrija, en una frase." },
  { title: "Arquitectura e identidad", body: "Una arquitectura para Universidad, Business School, institutos y sedes. Un logotipo con reglas, un rojo, una tipografía que recupere la serifa y una dirección fotográfica." },
  { title: "Sistema de diseño", body: "Colores, tipografía, componentes web y plantillas para redes y presentaciones, para que cada equipo publique rápido sin inventar su propia versión de Nebrija." },
  { title: "Web y redes", body: "Una portada que cuente por qué elegir Nebrija y guíe a cada perfil, fichas de grado más ligeras y formatos pensados para TikTok e Instagram." },
];

export const QUICK_WINS = [
  "Unificar el rojo de marca en todas las webs.",
  "Subir el bloque de empleabilidad a la primera pantalla de la portada.",
  "Quitar el emoji del texto principal y el velo blanco de las fotos.",
  "Eliminar el enlace al entorno de desarrollo y añadir texto alternativo a las imágenes.",
  "Diseñar portadas para las historias destacadas de Instagram.",
];

export const DATA_NEEDED = [
  "Analítica web: visitas, dispositivo, origen del tráfico y conversión a solicitud de información.",
  "Estadísticas de Instagram, TikTok, YouTube y LinkedIn: alcance, impresiones e interacción.",
  "Embudo de captación: solicitudes, asistentes a jornadas, pruebas de admisión y matrículas por programa.",
  "Inversión en campañas de pago y coste por solicitud.",
  "Manual de marca vigente, si existe, y los equipos responsables de cada web.",
];

// ——— Design-system inventory: computed styles of every visible text element
// and box on 13 pages (7 of nebrija.com + Business School, FP, Lenguas
// Modernas, Competencias, Actos, admisiones), 20 nov 2026, desktop 1440px.

export const DS_STATS = [
  { value: "61", label: "tamaños de letra distintos" },
  { value: "59", label: "interlineados distintos" },
  { value: "135", label: "combinaciones de estilo de texto" },
  { value: "6", label: "pesos tipográficos, de 100 a 900" },
  { value: "8", label: "tonos de rojo" },
  { value: "19", label: "tonos de gris" },
  { value: "17", label: "radios de esquina" },
  { value: "19", label: "estilos de botón" },
];

export const SIZES_ALL = [11.2, 12, 12.24, 12.28, 13, 13.6, 13.9, 14, 14.45, 14.79, 15.13, 16, 16.15, 17, 17.6, 18, 18.4, 18.52, 18.7, 19.1, 19.55, 20, 20.4, 21.25, 22, 22.08, 22.1, 22.31, 24, 24.2, 24.96, 25.44, 25.5, 26.01, 26.46, 28, 28.05, 28.9, 29.75, 30.45, 33.43, 34, 34.56, 34.85, 35.19, 37.21, 38.4, 40, 40.8, 42.5, 46.08, 47.76, 50.75, 53.55, 56, 57.38, 76, 76.5, 76.8, 80, 91.8];
export const SIZES_MAIN = [12, 14, 16, 18, 20, 24, 28, 40, 56, 76];
export const SIZES_IDEAL = [12, 14, 16, 20, 28, 40, 56, 80];

// Heading levels on nebrija.com's home page: the sizes each level takes
export const HEADINGS_HOME = [
  { tag: "H1", sizes: [40] },
  { tag: "H2", sizes: [24, 40, 56] },
  { tag: "H3", sizes: [18, 28, 40, 76] },
  { tag: "H4", sizes: [28, 40, 76] },
];

export const REDS_ALL = ["#B22334", "#B32535", "#B6012D", "#B6404E", "#BE0030", "#C2002F", "#CF1341", "#F0194D"];
export const GREYS_ALL = ["#111111", "#171717", "#191919", "#1F1D1B", "#212529", "#222222", "#2A2A2A", "#333333", "#343A40", "#3E3E3E", "#404040", "#444444", "#666666", "#777777", "#A6A6A6", "#CCCCCC", "#ECECEC", "#F1F1F1", "#F1F2F3"];
export const RADII = ["3px", "3.25px", "4px", "4.25px", "5px", "9px", "10px", "20px", "25px", "26px", "30px", "32px", "34px", "40px", "50px", "60px", "50%"];

export const PER_SITE = [
  { site: "nebrija.com (7 páginas)", sizes: 10, lh: 5, combos: 39, buttons: 9 },
  { site: "Business School", sizes: 10, lh: 4, combos: 25, buttons: 4 },
  { site: "Instituto FP", sizes: 26, lh: 21, combos: 37, buttons: 3 },
  { site: "Lenguas Modernas", sizes: 18, lh: 17, combos: 22, buttons: 1 },
  { site: "Competencias", sizes: 11, lh: 9, combos: 17, buttons: 2 },
  { site: "Actos", sizes: 7, lh: 12, combos: 18, buttons: 4 },
];

// Severity and priority per section (P1 = first, it blocks the rest)
export type Priority = 1 | 2 | 3;
export const PRIORITY_LABEL: Record<Priority, string> = { 1: "Prioridad alta", 2: "Prioridad media", 3: "Prioridad baja" };

export const TAGS: Record<string, { state: State; priority?: Priority }> = {
  arquitectura: { state: "critico", priority: 1 },
  logotipo: { state: "critico", priority: 1 },
  color: { state: "mejorable", priority: 2 },
  tipografia: { state: "critico", priority: 1 },
  sistema: { state: "critico", priority: 1 },
  fotografia: { state: "mejorable", priority: 2 },
  web: { state: "critico", priority: 1 },
  movil: { state: "mejorable", priority: 1 },
  institutos: { state: "mejorable", priority: 2 },
  tecnica: { state: "mejorable", priority: 2 },
  redes: { state: "mejorable", priority: 3 },
  fortalezas: { state: "correcto" },
};

export const QUICK_WINS_TAGGED: { text: string; priority: Priority; effort: "Esfuerzo bajo" | "Esfuerzo medio" }[] = [
  { text: "Subir el bloque de empleabilidad a la primera pantalla de la portada.", priority: 1, effort: "Esfuerzo bajo" },
  { text: "Eliminar el enlace al entorno de desarrollo.", priority: 1, effort: "Esfuerzo bajo" },
  { text: "Unificar el rojo de marca en todas las webs.", priority: 1, effort: "Esfuerzo medio" },
  { text: "Quitar el emoji del texto principal y el velo blanco de las fotos.", priority: 2, effort: "Esfuerzo bajo" },
  { text: "Añadir texto alternativo a las imágenes.", priority: 2, effort: "Esfuerzo medio" },
  { text: "Diseñar portadas para las historias destacadas de Instagram.", priority: 3, effort: "Esfuerzo bajo" },
];

// ——— Typography, measured per site: [size in px, how many text elements use it]
export type SizeUse = [number, number];
export const TYPE_SITES: { id: string; site: string; family: string; css: string; sizes: SizeUse[]; ideal?: boolean }[] = [
  {
    id: "fp", site: "Instituto FP", family: "Roboto", css: "Roboto, sans-serif",
    sizes: [[12.24, 36], [12.28, 4], [13.6, 3], [14.79, 1], [15.13, 4], [16.15, 3], [17, 40], [18.52, 4], [18.7, 40], [20.4, 29], [21.25, 14], [22.1, 26], [22.31, 2], [25.5, 3], [26.01, 2], [28.05, 4], [29.75, 8], [30.45, 2], [34, 33], [35.19, 1], [37.21, 1], [42.5, 1], [50.74, 1], [53.55, 1], [57.38, 1], [76.5, 7]],
  },
  {
    id: "idiomas", site: "Lenguas Modernas", family: "Arial MT Pro", css: "Arial, Helvetica, sans-serif",
    sizes: [[13.6, 4], [16, 2], [17.6, 7], [18.4, 12], [19.1, 2], [22, 1], [22.08, 1], [24.2, 1], [24.96, 3], [25.44, 4], [26.46, 3], [33.43, 1], [34.56, 2], [34.85, 4], [38.4, 2], [46.08, 7], [47.76, 1], [76.8, 3]],
  },
  {
    id: "competencias", site: "Competencias", family: "Roboto", css: "Roboto, sans-serif",
    sizes: [[13.9, 1], [14.45, 3], [16.15, 4], [17, 6], [18.7, 16], [19.55, 6], [22, 1], [28.9, 1], [34.56, 2], [40.8, 11], [91.8, 3]],
  },
  {
    id: "main", site: "nebrija.com", family: "Roboto", css: "Roboto, sans-serif",
    sizes: [[12, 454], [14, 270], [16, 100], [18, 598], [20, 33], [24, 17], [28, 259], [40, 114], [56, 19], [76, 15]],
  },
  {
    id: "ideal", site: "Una escala cerrada", family: "Ejemplo", css: "Inter, sans-serif", ideal: true,
    sizes: [[12, 0], [14, 0], [16, 0], [20, 0], [28, 0], [40, 0], [56, 0], [80, 0]],
  },
];

export const FAMILIES = [
  { name: "Roboto", css: "Roboto, sans-serif", uses: "2.544", where: "nebrija.com, Business School, FP, Competencias y Actos", note: "La fuente por defecto de Android y de Google." },
  { name: "Arial MT Pro", css: "Arial, Helvetica, sans-serif", uses: "63", where: "Lenguas Modernas y portal de admisiones, en tres cortes: Light, Regular y Condensed Bold", note: "Una versión de Arial, la fuente por defecto de Windows." },
];

export const WEIGHTS = [100, 300, 400, 500, 700, 900];
