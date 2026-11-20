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
  { area: "Tipografía", state: "critico", finding: "Roboto y Arial; la serifa del logotipo no se usa nunca.", to: "tipografia" },
  { area: "Mensaje y jerarquía", state: "critico", finding: "El Nº1 en inserción laboral aparece a unos 3.000 px.", to: "web" },
  { area: "Color", state: "mejorable", finding: "Tres rojos de marca y colores sueltos sin función.", to: "color" },
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
