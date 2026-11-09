// Táctica: the pair (app icon close-up + phone in hand) is the index thumbnail
// and opens the case, full width and unframed, above the Context clip.
// Run with: npx sanity exec patch-tactica-pair.ts --with-user-token (from studio/)
import {readFileSync} from 'fs'
import {getCliClient} from 'sanity/cli'

const client = getCliClient()

async function run() {
  const a = await client.assets.upload('image', readFileSync(`${process.cwd()}/media/tactica/tactica-pair.jpg`), {filename: 'tactica-pair.jpg'})
  const ref = {_type: 'reference', _ref: a._id}
  await client
    .patch('project-tactica')
    .set({cover: {_type: 'image', asset: ref}})
    .setIfMissing({'sections[_key=="context"].images': []})
    .insert('replace', 'sections[_key=="context"].images[_key=="img-pair"]', [])
    .commit()
  await client
    .patch('project-tactica')
    .append('sections[_key=="context"].images', [
      {
        _key: 'img-pair',
        _type: 'image',
        asset: ref,
        full: true,
        alt: 'Táctica: the app icon on an iPhone home screen, and a chess puzzle in play on a phone in hand',
        altEs: 'Táctica: el icono de la app en la pantalla de inicio de un iPhone y un problema de ajedrez en juego en un móvil en la mano',
      },
    ])
    .commit()
  console.log('Táctica pair set:', a.url)
}
run().catch((e) => { console.error(e); process.exit(1) })
