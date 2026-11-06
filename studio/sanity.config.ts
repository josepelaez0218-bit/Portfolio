import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

// "Textos de la web" is a single document: it opens straight from the menu
const TEXTS_ID = 'siteTexts'
// Types the web no longer shows (old Home, About, Lab): out of the menu
const HIDDEN = new Set(['siteTexts', 'home', 'about', 'labItem'])

export default defineConfig({
  name: 'default',
  title: 'Jose Peláez',

  projectId: '2u19gait',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Contenido')
          .items([
            S.listItem()
              .title('Textos de la web')
              .id(TEXTS_ID)
              .child(S.document().schemaType('siteTexts').documentId(TEXTS_ID).title('Textos de la web')),
            S.divider(),
            S.documentTypeListItem('project').title('Proyectos'),
            ...S.documentTypeListItems().filter((item) => !HIDDEN.has(item.getId() ?? '') && item.getId() !== 'project'),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    // Only projects can be created from "+"; the texts document already exists
    templates: (templates) => templates.filter(({schemaType}) => !HIDDEN.has(schemaType)),
  },
})
