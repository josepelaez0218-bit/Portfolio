// Seedtag Events: stat boxes under the Solution.
// Run with: npx sanity exec patch-seedtag-events-stats.ts --with-user-token (from studio/)
import {getCliClient} from 'sanity/cli'

const stats = [
  {_key: 's1', _type: 'stat', value: '<15', label: 'min target to publish a landing', labelEs: 'min objetivo para publicar una landing'},
  {_key: 's2', _type: 'stat', value: '16', label: 'on-brand sections', labelEs: 'secciones de marca'},
  {_key: 's3', _type: 'stat', value: '4', label: 'pieces per event', labelEs: 'piezas por evento'},
]

getCliClient()
  .patch('project-seedtag-events')
  .set({'sections[_key=="solution"].stats': stats})
  .commit()
  .then(() => console.log('Seedtag Events stats set'))
  .catch((e) => { console.error(e); process.exit(1) })
