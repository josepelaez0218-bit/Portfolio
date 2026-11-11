// Production: hide the CECI Makeup case (reversible: set hidden:false and re-add the slug to PUBLIC_CASES).
// Run with: npx sanity exec hide-ceci.ts --with-user-token
import {writeFileSync} from 'fs'
import {getCliClient} from 'sanity/cli'
const client = getCliClient()
async function run() {
  const ceci = await client.fetch(`*[_type=="project" && slug.current=="ceci-makeup"][0]`)
  if (!ceci) throw new Error('ceci-makeup not found')
  writeFileSync(`${process.cwd()}/backup-ceci-2026-11-11.json`, JSON.stringify(ceci, null, 2))
  await client.patch(ceci._id).set({hidden: true}).commit()
  console.log('CECI hidden:', ceci._id)
}
run().catch((e) => { console.error(e); process.exit(1) })
