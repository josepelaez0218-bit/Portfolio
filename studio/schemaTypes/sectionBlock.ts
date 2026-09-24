import {defineField, defineType} from 'sanity'

export const sectionBlock = defineType({
  name: 'sectionBlock',
  title: 'Section',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      description: 'Shown as the tab/heading in the case study, e.g. "Context", "Problem".',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 6,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Supporting images (optional)',
      description: 'Add more than one to show them together — side by side, or stacked (see layout below).',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'video',
      title: 'Supporting video (optional)',
      description: 'A single video clip, shown full width below the supporting images (if any).',
      type: 'file',
      options: {accept: 'video/*'},
      fields: [
        defineField({
          name: 'caption',
          title: 'Caption (optional)',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'stats',
      title: 'Highlighted stats (optional)',
      description: 'Big numbers shown as cards at a glance, e.g. "634" / "Users" or "54.79%" / "Engagement rate".',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'stat',
          fields: [
            defineField({
              name: 'value',
              title: 'Value',
              description: 'The big number, e.g. "634", "54.79%", "34s".',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              description: 'What it means, e.g. "Users", "Engagement rate".',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {title: 'value', subtitle: 'label'},
          },
        },
      ],
    }),
    defineField({
      name: 'mediaOrder',
      title: 'Media order',
      description: 'Only matters when both images and a video are set above.',
      type: 'string',
      options: {
        list: [
          {title: 'Images, then video', value: 'images-first'},
          {title: 'Video, then images', value: 'video-first'},
        ],
        layout: 'radio',
      },
      initialValue: 'images-first',
    }),
    defineField({
      name: 'imagesLayout',
      title: 'Multiple images layout',
      description: 'Only matters with 2+ supporting images above.',
      type: 'string',
      options: {
        list: [
          {title: 'Side by side (2 columns)', value: 'grid'},
          {title: 'Grid (3 columns)', value: 'grid-3'},
          {title: 'Stacked, one below another', value: 'stacked'},
        ],
        layout: 'radio',
      },
      initialValue: 'grid',
    }),
  ],
  preview: {
    select: {title: 'label', subtitle: 'body'},
  },
})
