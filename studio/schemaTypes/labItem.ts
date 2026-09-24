import {defineField, defineType} from 'sanity'

export const labItem = defineType({
  name: 'labItem',
  title: 'Lab item',
  type: 'document',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption (optional)',
      description: 'Shown under the image, if you want a short note.',
      type: 'string',
    }),
    defineField({
      name: 'order',
      title: 'Grid order',
      description: 'Lower numbers show first.',
      type: 'number',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'caption', media: 'image'},
    prepare: ({title, media}) => ({title: title || 'Untitled', media}),
  },
})
