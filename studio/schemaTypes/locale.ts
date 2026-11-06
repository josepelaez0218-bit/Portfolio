import {defineField, defineType} from 'sanity'

// A text in both languages of the site, side by side. The web shows the
// English one by default and the Spanish one when the visitor picks ES;
// an empty Spanish field falls back to the English text.

export const localeString = defineType({
  name: 'localeString',
  title: 'Texto',
  type: 'object',
  options: {columns: 2},
  fields: [
    defineField({name: 'en', title: 'English', type: 'string'}),
    defineField({name: 'es', title: 'Español', type: 'string'}),
  ],
})

export const localeText = defineType({
  name: 'localeText',
  title: 'Texto',
  type: 'object',
  options: {columns: 2},
  fields: [
    defineField({name: 'en', title: 'English', type: 'text', rows: 3}),
    defineField({name: 'es', title: 'Español', type: 'text', rows: 3}),
  ],
})
