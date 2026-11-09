// Emotion Quotient: a shorter preview loop (2.4s), so the bars grow again
// soon instead of after five still seconds. Original kept in media/emotion-quotient/.
// Run with: npx sanity exec patch-eq-preview.ts --with-user-token (from studio/)
import {readFileSync} from 'fs'
import {getCliClient} from 'sanity/cli'

const client = getCliClient()

async function run() {
  const a = await client.assets.upload('file', readFileSync(`${process.cwd()}/media/emotion-quotient/eq-preview.mp4`), {filename: 'emotion-quotient-preview.mp4', contentType: 'video/mp4'})
  await client.patch('project-seedtag-emotion-quotient').set({coverVideo: {_type: 'file', asset: {_type: 'reference', _ref: a._id}}}).commit()
  console.log('EQ preview set:', a.url)
}
run().catch((e) => { console.error(e); process.exit(1) })
