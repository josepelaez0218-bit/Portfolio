import {defineField, defineType} from 'sanity'

export const about = defineType({
  name: 'about',
  title: 'About',
  type: 'document',
  fields: [
    defineField({
      name: 'photo',
      title: 'Photo (optional)',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      description: 'First person, a few short paragraphs. Blank lines start a new paragraph.',
      type: 'text',
      rows: 8,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'services',
      title: 'Services',
      description: 'What you can be hired for, shown as a short list.',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
    }),
  ],
  preview: {
    select: {subtitle: 'location'},
    prepare: ({subtitle}) => ({title: 'About', subtitle}),
  },
})
