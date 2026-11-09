// Seedtag Design System: Documentation keeps only its full-width picture (the Mosaic clip goes).
// Run with: npx sanity exec patch-sds-doc-novideo.ts --with-user-token (from studio/)
import {getCliClient} from 'sanity/cli'

getCliClient()
  .patch('project-seedtag-design-system')
  .unset(['sections[_key=="documentation"].video', 'sections[_key=="documentation"].video2'])
  .commit()
  .then(() => console.log('Documentation clip removed'))
  .catch((e) => { console.error(e); process.exit(1) })
