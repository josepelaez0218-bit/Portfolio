// The work behind the services (public/services/), each at its own proportion.
export type Piece = { src: string; ratio: number; name: string; alt: { en: string; es: string } };
export type Pic = { src: string; ratio: number; name: string; alt: string };

const p = (file: string, w: number, h: number, name: string, en: string, es: string): Piece => ({ src: `/services/${file}.webp`, ratio: w / h, name, alt: { en, es } });

export const PIECES: Piece[] = [
  p("steamy-bambini", 1920, 1080, "Steamy Bambini", "Steamy Bambini podcast cover", "Portada del pódcast Steamy Bambini"),
  p("dkp-chat", 1512, 1004, "AI assistant", "An AI assistant's chat behaviour settings", "Ajustes del comportamiento del chat de un asistente con IA"),
  p("dkp-solutions", 1512, 856, "Product solutions", "A product solutions page with a phone preview", "Una página de soluciones de producto con vista en móvil"),
  p("ekcorr-cards", 1302, 908, "Black Coffee", "Business cards for a brand identity", "Tarjetas de visita de una identidad de marca"),
  p("ekcorr-bag", 781, 942, "Black Coffee", "The same identity on a shopping bag", "La misma identidad en una bolsa"),
  p("seedtag-creativity", 1512, 982, "Seedtag Creativity", "Seedtag article page: Understanding Vector Based Targeting", "Artículo de Seedtag: Understanding Vector Based Targeting"),
  p("design-system", 1440, 942, "Design system", "Design system: tag component and chart styles", "Sistema de diseño: componente de etiqueta y estilos de gráficos"),
  p("seedtag-newsletter", 600, 1434, "Seedtag newsletter", "Seedtag newsletter components on a phone", "Componentes de la newsletter de Seedtag en un móvil"),
  p("fanfan", 1440, 954, "FanFan", "FanFan app icon on a phone", "Icono de la app FanFan en un móvil"),
  p("yo-me-abismo", 685, 458, "Yo me abismo", "“Yo me abismo”, a typographic piece", "«Yo me abismo», una pieza tipográfica"),
  p("seedtag-preview", 1440, 942, "Seedtag Studio", "Seedtag: a video ad preview", "Seedtag: vista previa de un anuncio en vídeo"),
  p("seedtag-templates", 1306, 750, "Seedtag Studio", "Seedtag: picking an ad strategy and downloading its design templates", "Seedtag: elegir una estrategia de anuncio y descargar sus plantillas"),
  p("law-firm", 1333, 752, "Law firm", "A law firm's website", "La web de un despacho de abogados"),
  p("coffee", 720, 800, "Café", "A café's website, with its logo on the window", "La web de una cafetería, con su logo en el cristal"),
  p("specifications", 1112, 740, "Specifications", "Design system specifications page", "Página de especificaciones del sistema de diseño"),
];

// The services' own pictures (from Sanity), named for the labels
export const LEAD_NAMES = ["Julita", "Belén de las Nieves", "The Kooks", "Global Innovation Summit"];

export const Img = ({ pic, fit = "cover" }: { pic: { src: string; alt: string }; fit?: "cover" | "contain" }) => (
  <img src={pic.src} alt={pic.alt} loading="lazy" decoding="async" draggable={false} className={`block w-full h-full ${fit === "cover" ? "object-cover" : "object-contain"}`} />
);
