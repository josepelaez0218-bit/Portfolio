// Seedtag Design System: the Documentation picture runs full width, unframed.
// Run with: npx sanity exec patch-sds-doc-full.ts --with-user-token (from studio/)
import {getCliClient} from 'sanity/cli'

getCliClient()
  .patch('project-seedtag-design-system')
  .set({'sections[_key=="documentation"].images[_key=="img-tag-and-data"].full': true})
  .commit()
  .then(() => console.log('Documentation picture set to full width'))
  .catch((e) => { console.error(e); process.exit(1) })
