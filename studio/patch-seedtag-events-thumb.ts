// Seedtag Events: the index thumbnail is the laptop mockup (a marketer editing a
// landing). Its looping cover video goes, so the image shows; the AWNY clip stays in Context.
// Run with: npx sanity exec patch-seedtag-events-thumb.ts --with-user-token (from studio/)
import {readFileSync} from 'fs'
import {getCliClient} from 'sanity/cli'

const client = getCliClient()

async function run() {
  const a = await client.assets.upload('image', readFileSync(`${process.cwd()}/media/seedtag-events/se-laptop-mockup.jpg`), {filename: 'seedtag-events-laptop-mockup.jpg'})
  await client
    .patch('project-seedtag-events')
    .set({cover: {_type: 'image', asset: {_type: 'reference', _ref: a._id}}})
    .unset(['coverVideo'])
    .commit()
  console.log('Seedtag Events thumbnail set:', a.url)
}
run().catch((e) => { console.error(e); process.exit(1) })
