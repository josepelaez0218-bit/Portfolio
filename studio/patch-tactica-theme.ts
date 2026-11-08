// Táctica case: the light/dark switch video in the Problem section
// (three phones, Entrenar · Reto diario · Estadísticas, revealing the other theme from the header).
// Run with: npx sanity exec patch-tactica-theme.ts --with-user-token
import {readFileSync} from 'fs'
import {homedir} from 'os'
import {getCliClient} from 'sanity/cli'

const client = getCliClient()
const FILE = `${homedir()}/Desktop/tactica-theme-v1.mp4`

async function run() {
  const doc = await client.getDocument('project-tactica')
  if (!doc?.sections?.some((s: {_key: string}) => s._key === 'problem')) throw new Error('No Problem section in project-tactica')
  console.log('Uploading video...')
  const video = await client.assets.upload('file', readFileSync(FILE), {filename: 'tactica-theme-v1.mp4', contentType: 'video/mp4'})
  await client
    .patch('project-tactica')
    .set({'sections[_key=="problem"].video': {_type: 'file', asset: {_type: 'reference', _ref: video._id}}})
    .commit()
  console.log('Problem section now shows', video.url)
}
run().catch((e) => { console.error(e); process.exit(1) })
