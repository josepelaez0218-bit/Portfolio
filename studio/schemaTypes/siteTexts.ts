import {defineArrayMember, defineField, defineType} from 'sanity'

// Every fixed text of the web, in English and Spanish, plus the pictures of
// the services. One single document (it opens straight from the menu). Field
// names match the keys the web reads (src/lib/i18n.ts), so don't rename them.

const s = (name: string, title: string, group: string, description?: string) =>
  defineField({name, title, type: 'localeString', group, description})
const t = (name: string, title: string, group: string, description?: string) =>
  defineField({name, title, type: 'localeText', group, description})

export const siteTexts = defineType({
  name: 'siteTexts',
  title: 'Textos de la web',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'services', title: 'Servicios'},
    {name: 'contact', title: 'Contacto'},
    {name: 'footer', title: 'Footer'},
    {name: 'cases', title: 'Casos'},
    {name: 'nav', title: 'Menú'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    // Hero
    t('heroIntro', 'Presentación', 'hero', 'La frase grande de la tarjeta del hero.'),
    t('heroLine', 'Frase pequeña', 'hero', 'Debajo de la presentación. Un salto de línea aquí es un salto de línea en la web.'),
    s('startProject', 'Botón “Start a project”', 'hero', 'Se usa en el hero, el contacto y el footer.'),
    s('scrollHint', 'Aviso de scroll', 'hero', 'El texto pequeño al pie del hero.'),

    // Services
    s('servicesTitle', 'Título', 'services'),
    t('servicesLead', 'Entradilla', 'services'),
    defineField({
      name: 'services',
      title: 'Servicios',
      description: 'Se muestran en este orden, cada uno con su imagen debajo. Lo pensado son 4.',
      type: 'array',
      group: 'services',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'service',
          fields: [
            defineField({name: 'name', title: 'Nombre', type: 'localeString'}),
            defineField({name: 'line', title: 'Descripción', type: 'localeText'}),
            defineField({
              name: 'image',
              title: 'Imagen',
              description: 'Se ve entera, sin recortar, con su propia proporción.',
              type: 'image',
              fields: [defineField({name: 'alt', title: 'Texto alternativo', type: 'localeString'})],
            }),
          ],
          preview: {select: {title: 'name.en', subtitle: 'name.es', media: 'image'}},
        }),
      ],
    }),

    // Contact
    t('closeLead', 'Titular', 'contact'),
    t('closeLine', 'Texto', 'contact'),
    t('closeMore', 'Texto del formulario', 'contact', 'Aparece encima del formulario al pulsar “Start a project”.'),
    defineField({
      name: 'email',
      title: 'Email de contacto',
      description: 'Adonde llegan los mensajes del formulario y el que se ve en el footer.',
      type: 'string',
      group: 'contact',
    }),
    s('qName', 'Pregunta 1 (nombre)', 'contact'),
    s('pName', 'Ejemplo 1', 'contact'),
    s('qEmail', 'Pregunta 2 (email)', 'contact'),
    s('pEmail', 'Ejemplo 2', 'contact'),
    s('qMessage', 'Pregunta 3 (proyecto)', 'contact'),
    s('pMessage', 'Ejemplo 3', 'contact'),
    s('send', 'Botón enviar', 'contact'),
    s('formError', 'Error del formulario', 'contact'),
    s('mailSubject', 'Asunto del email', 'contact'),
    s('back', 'Volver', 'contact', 'También el “← Back” de los casos.'),
    s('seeYourself', 'Botón de la cámara', 'contact'),
    s('stopCamera', 'Parar la cámara', 'contact'),
    s('noCamera', 'Cámara no disponible', 'contact'),

    // Footer
    t('footerBlurb', 'Texto', 'footer'),
    s('navigate', 'Título “Navigate”', 'footer'),
    s('projects', 'Enlace “Projects”', 'footer'),
    s('backToTop', 'Volver arriba', 'footer'),

    // Case pages
    s('role', 'Rol', 'cases'),
    s('team', 'Equipo', 'cases'),
    s('timeline', 'Fecha', 'cases'),
    s('visitLive', 'Botón “Visit live site”', 'cases'),
    s('nextProject', 'Siguiente proyecto', 'cases'),

    // Menu
    s('work', 'Work', 'nav'),
    s('contact', 'Contact', 'nav'),
    s('openMenu', 'Abrir menú (lectores de pantalla)', 'nav'),
    s('closeMenu', 'Cerrar menú (lectores de pantalla)', 'nav'),

    // SEO
    s('seoTitle', 'Título de la página', 'seo', 'Lo que sale en la pestaña del navegador y en Google.'),
    t('seoDescription', 'Descripción', 'seo', 'El texto bajo el título en Google y al compartir el enlace.'),
    defineField({
      name: 'ogImage',
      title: 'Imagen al compartir',
      description: '1200×630. Si está vacía se usa la actual (og-image.png).',
      type: 'image',
      group: 'seo',
    }),
  ],
  preview: {prepare: () => ({title: 'Textos de la web'})},
})
