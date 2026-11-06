// One-off: creates the "Textos de la web" document (id siteTexts) with the
// texts the web had in code (src/lib/siteTextsFallback.ts) and uploads the
// four services pictures. Uses createIfNotExists, so running it again never
// overwrites what has been edited in the Studio.
// Run with: npx sanity exec seed-site-texts.ts --with-user-token
import {readFileSync} from 'fs'
import {getCliClient} from 'sanity/cli'
import {EMAIL, SERVICES, STRINGS} from '../src/lib/siteTextsFallback'

const client = getCliClient()
const PUBLIC = decodeURIComponent(new URL('../public', import.meta.url).pathname)

const SHORT = new Set(['heroIntro', 'heroLine', 'servicesLead', 'closeLead', 'closeLine', 'closeMore', 'footerBlurb', 'seoDescription'])

async function run() {
  const exists = await client.fetch('defined(*[_id == "siteTexts"][0]._id)')
  if (exists) {
    console.log('siteTexts already exists — nothing to do.')
    return
  }
  const doc: Record<string, unknown> = {_id: 'siteTexts', _type: 'siteTexts', email: EMAIL}
  for (const k of Object.keys(STRINGS.en) as (keyof typeof STRINGS.en)[]) {
    if (k === 'letsTalk') continue // not on the web any more
    doc[k] = {_type: SHORT.has(k) ? 'localeText' : 'localeString', en: STRINGS.en[k], es: STRINGS.es[k]}
  }
  console.log('Uploading services pictures...')
  doc.services = await Promise.all(
    SERVICES.map(async (s, i) => {
      const file = `${PUBLIC}${s.src}`
      const asset = await client.assets.upload('image', readFileSync(file), {filename: s.src.split('/').pop()})
      return {
        _key: `service${i + 1}`,
        _type: 'service',
        name: {_type: 'localeString', ...s.name},
        line: {_type: 'localeText', ...s.line},
        image: {
          _type: 'image',
          asset: {_type: 'reference', _ref: asset._id},
          alt: {_type: 'localeString', ...s.alt},
        },
      }
    }),
  )
  await client.createIfNotExists(doc as {_id: string; _type: string})
  console.log('Created siteTexts with', Object.keys(doc).length, 'fields.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
