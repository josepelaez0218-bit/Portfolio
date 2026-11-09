// Táctica: the index thumbnail is the hand-held phone mockup with a puzzle in
// play. Its looping cover video goes, so the image shows; the case's clips stay.
// Run with: npx sanity exec patch-tactica-thumb.ts --with-user-token (from studio/)
import {readFileSync} from 'fs'
import {getCliClient} from 'sanity/cli'

const client = getCliClient()

async function run() {
  const a = await client.assets.upload('image', readFileSync(`${process.cwd()}/media/tactica/tactica-hand-mockup.jpg`), {filename: 'tactica-hand-mockup.jpg'})
  await client
    .patch('project-tactica')
    .set({cover: {_type: 'image', asset: {_type: 'reference', _ref: a._id}}})
    .unset(['coverVideo'])
    .commit()
  console.log('Táctica thumbnail set:', a.url)
}
run().catch((e) => { console.error(e); process.exit(1) })
