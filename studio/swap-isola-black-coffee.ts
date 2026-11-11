// Production swap: hide ISOLA (reversible: set hidden:false) and show Black Coffee in its slot.
// Run with: npx sanity exec swap-isola-black-coffee.ts --with-user-token
import {writeFileSync} from 'fs'
import {getCliClient} from 'sanity/cli'
const client = getCliClient()
async function run() {
  const isola = await client.getDocument('project-isola')
  if (!isola) throw new Error('project-isola not found')
  writeFileSync(`${process.cwd()}/backup-isola-2026-11-11.json`, JSON.stringify(isola, null, 2))
  const bc = await client.getDocument('project-black-coffee')
  if (!bc) throw new Error('project-black-coffee not found')
  await client.patch('project-isola').set({hidden: true}).commit()
  await client.patch('project-black-coffee').set({hidden: false, order: isola.order ?? 4.2}).commit()
  console.log('ISOLA hidden; Black Coffee visible at order', isola.order ?? 4.2)
}
run().catch((e) => { console.error(e); process.exit(1) })
