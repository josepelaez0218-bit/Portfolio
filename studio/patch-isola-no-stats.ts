// ISOLA case: no stats under the Solution (the stat boxes stay in the schema for other cases).
// Run with: npx sanity exec patch-isola-no-stats.ts --with-user-token (from studio/)
import {getCliClient} from 'sanity/cli'

getCliClient()
  .patch('project-isola')
  .unset(['sections[_key=="solution"].stats'])
  .commit()
  .then(() => console.log('ISOLA stats removed'))
  .catch((e) => { console.error(e); process.exit(1) })
