// Seedtag Events case: the landing clip is the real AWNY landing (cover video
// and Context section), in place of the demo event's.
// Run with: npx sanity exec patch-seedtag-events-awny.ts --with-user-token (from studio/)
import {readFileSync} from 'fs'
import {getCliClient} from 'sanity/cli'

const client = getCliClient()

async function run() {
  const a = await client.assets.upload('file', readFileSync(`${process.cwd()}/media/seedtag-events/se-landing-awny.mp4`), {filename: 'seedtag-events-awny.mp4', contentType: 'video/mp4'})
  const video = {_type: 'file', asset: {_type: 'reference', _ref: a._id}}
  await client.patch('project-seedtag-events').set({coverVideo: video, 'sections[_key=="context"].video': video}).commit()
  console.log('AWNY landing clip set:', a.url)
}
run().catch((e) => { console.error(e); process.exit(1) })
