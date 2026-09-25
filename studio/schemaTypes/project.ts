import {defineField, defineType} from 'sanity'

export const CATEGORIES = ['Web', 'Branding', 'Photography', 'Illustration'] as const

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'Short teaser shown under the title in the projects grid.',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {list: [...CATEGORIES]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      description: 'Shown next to the title in the grid, e.g. "Web · Data-driven".',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'cover',
      title: 'Cover image',
      description: 'Used in the projects grid. Designed for a 3:2 crop.',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverVideo',
      title: 'Cover video (optional)',
      description: 'If set, plays instead of the cover image in the projects grid — a few looping seconds, no audio.',
      type: 'file',
      options: {accept: 'video/*'},
    }),
    defineField({
      name: 'coverOverlay',
      title: 'Cover overlay logo (optional)',
      description: 'A logo/badge image pinned over the top-right of the cover in the grid — e.g. a client logo composited on top of a photo or video cover. Use a transparent PNG/SVG-exported PNG.',
      type: 'image',
    }),
    defineField({
      name: 'hero',
      title: 'Hero image',
      description: 'Big image at the top of the case study.',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroVideo',
      title: 'Hero video (optional)',
      description: 'If set, plays instead of the hero image at the top of the case study (autoplay, loop, muted).',
      type: 'file',
      options: {accept: 'video/*'},
    }),
    defineField({
      name: 'heroBleed',
      title: 'Full-bleed hero',
      description: 'On: hero spans edge-to-edge, no frame. Off (default): framed gray section.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'liveUrl',
      title: 'Live URL (optional)',
      description: 'If the project is publicly visitable, shows a "Visit live site" button on the case study. Leave empty for internal/private projects.',
      type: 'url',
    }),
    defineField({
      name: 'timeline',
      title: 'Timeline',
      type: 'string',
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
    }),
    defineField({
      name: 'team',
      title: 'Team',
      type: 'string',
    }),
    defineField({
      name: 'sections',
      title: 'Case study sections',
      description: 'Add, remove or reorder freely — a short project doesn\'t need all of them.',
      type: 'array',
      of: [{type: 'sectionBlock'}],
    }),
    defineField({
      name: 'order',
      title: 'Grid order',
      description: 'Lower numbers show first in the projects grid.',
      type: 'number',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'hidden',
      title: 'Hidden',
      description: 'On: keeps the project in Sanity but hides it from the projects grid (the page itself stays reachable by direct link). Off (default): visible.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'category', media: 'cover'},
  },
})
