// Hide the PUBLISHED CECI document (the earlier run only touched its Studio draft).
import {getCliClient} from 'sanity/cli'
const client = getCliClient()
async function run() {
  await client.patch('project-ceci-makeup').set({hidden: true}).commit()
  console.log('published project-ceci-makeup hidden')
}
run().catch((e) => { console.error(e); process.exit(1) })
