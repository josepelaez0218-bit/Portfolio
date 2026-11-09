// ISOLA case: the mobile piece is the catalogue in a hand-held phone mockup,
// in place of the two flat phones (RSVP + catalogue).
// Run with: npx sanity exec patch-isola-hand.ts --with-user-token (from studio/)
import {readFileSync} from 'fs'
import {getCliClient} from 'sanity/cli'

const client = getCliClient()

async function run() {
  const a = await client.assets.upload('image', readFileSync(`${process.cwd()}/media/isola-hand-catalogue.jpg`), {filename: 'isola-hand-catalogue.jpg'})
  await client
    .patch('project-isola')
    .set({
      'sections[_key=="solution"].images[_key=="img-mobile"].asset': {_type: 'reference', _ref: a._id},
      'sections[_key=="solution"].images[_key=="img-mobile"].alt': 'The mobile catalogue in the guest’s hand — the collection piece by piece, to reserve and pick up at the till',
      'sections[_key=="solution"].images[_key=="img-mobile"].altEs': 'El catálogo móvil en la mano del invitado: la colección pieza a pieza, para reservar y recoger en caja',
    })
    .commit()
  console.log('ISOLA mobile image set:', a.url)
}
run().catch((e) => { console.error(e); process.exit(1) })
