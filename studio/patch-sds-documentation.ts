// Seedtag Design System: Documentation shows one landscape image (the Tag
// component beside the data cards and chart built with it) in place of the
// two very tall component sheets.
// Run with: npx sanity exec patch-sds-documentation.ts --with-user-token (from studio/)
import {readFileSync} from 'fs'
import {getCliClient} from 'sanity/cli'

const client = getCliClient()

async function run() {
  const a = await client.assets.upload('image', readFileSync(`${process.cwd()}/../public/services/design-system.webp`), {filename: 'seedtag-design-system-tag-and-data.webp'})
  await client
    .patch('project-seedtag-design-system')
    .set({
      'sections[_key=="documentation"].images': [
        {
          _key: 'img-tag-and-data',
          _type: 'image',
          asset: {_type: 'reference', _ref: a._id},
          alt: 'Tag component documentation beside the data cards and bar chart built with the same tokens',
          altEs: 'Documentación del componente Tag junto a las tarjetas de datos y el gráfico de barras hechos con los mismos tokens',
        },
      ],
    })
    .commit()
  console.log('Documentation image set:', a.url)
}
run().catch((e) => { console.error(e); process.exit(1) })
