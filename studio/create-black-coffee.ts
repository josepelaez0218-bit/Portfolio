// Creates the "Black Coffee" case (brand identity) — HIDDEN from the index until Jose approves it
// (hidden: true; the page works locally at /work/black-coffee; on the live site only PUBLIC_CASES open).
// Run with: npx sanity exec create-black-coffee.ts --with-user-token
import {readFileSync} from 'fs'
import {getCliClient} from 'sanity/cli'

const client = getCliClient()
const MEDIA = '/private/tmp/claude-502/-Users-josepelaez/a7177a19-c63a-4ad8-8fef-e7bbd0816ce8/scratchpad/bc'
const ref = (id: string) => ({_type: 'reference' as const, _ref: id})
const img = async (file: string, alt?: string, altEs?: string, full?: boolean) => {
  const a = await client.assets.upload('image', readFileSync(`${MEDIA}/${file}`), {filename: file})
  return {_type: 'image' as const, asset: ref(a._id), ...(alt ? {alt, altEs} : {}), ...(full ? {full: true} : {})}
}

async function run() {
  console.log('Uploading media...')
  const hero = await img('bc-hero.png')
  const [cards, poster, apps] = await Promise.all([
    img('bc-cards.png', 'Black Coffee business cards: the stacked wordmark cropped and enlarged as a pattern, and a pale line drawing of a coffee plant', 'Tarjetas de Black Coffee: el logotipo apilado recortado y ampliado como patrón, y un dibujo a línea de una planta de café', true),
    img('bc-poster.png', 'Black Coffee poster on a gallery wall: the wordmark above a black-and-white photograph of two swimmers diving', 'Cartel de Black Coffee en una pared de galería: el logotipo sobre una fotografía en blanco y negro de dos nadadores en el agua', true),
    img('bc-applications.jpg', 'Black Coffee on a takeaway cup, a paper bag and an orange poster with two illustrated cups', 'Black Coffee en un vaso para llevar, una bolsa de papel y un cartel naranja con dos vasos ilustrados', true),
  ])
  await client.createOrReplace({
    _id: 'project-black-coffee',
    _type: 'project',
    title: 'Black Coffee',
    slug: {_type: 'slug', current: 'black-coffee'},
    hidden: true,
    order: 4.25,
    category: 'Branding',
    description: 'Brand identity for a coffee brand: a stacked wordmark of rounded, stencil-like letters, built to be cropped, enlarged and applied to cards, packaging, posters and signage.',
    descriptionEs: 'Identidad de marca para una marca de café: un logotipo apilado de letras redondeadas, tipo plantilla, pensado para recortarse, ampliarse y aplicarse en tarjetas, packaging, carteles y rotulación.',
    tags: ['Brand identity', 'Logo'],
    tagsEs: ['Identidad de marca', 'Logotipo'],
    cover: hero,
    hero,
    sections: [
      {
        _key: 'context', _type: 'sectionBlock', label: 'Context', labelEs: 'Contexto',
        body: 'I designed the identity for Black Coffee, a coffee brand. The starting point was the name itself: two short words that stack on top of each other, set in rounded, stencil-like letters.',
        bodyEs: 'Diseñé la identidad de Black Coffee, una marca de café. El punto de partida fue el propio nombre: dos palabras cortas que se apilan una sobre otra, dibujadas con letras redondeadas, tipo plantilla.',
      },
      {
        _key: 'solution', _type: 'sectionBlock', label: 'Solution', labelEs: 'Solución',
        body: 'The wordmark is the whole system. Stacked on two lines, with the second pushed to the right, it reads at a glance as a logo and, cropped and enlarged, as a pattern: that is how it fills the business cards, the paper bag and the cup.\n\nA pale line drawing of a coffee plant adds a quiet counterpoint. The posters, from a black-and-white photograph of two swimmers to a loud orange illustration of two cups with faces, show the brand can be calm or playful without touching the logo.',
        bodyEs: 'El logotipo es todo el sistema. Apilado en dos líneas, con la segunda desplazada a la derecha, se lee de un vistazo como logo y, recortado y ampliado, como patrón: así llena las tarjetas, la bolsa de papel y el vaso.\n\nUn dibujo a línea muy pálido de una planta de café aporta un contrapunto tranquilo. Los carteles, de una fotografía en blanco y negro de dos nadadores a una ilustración naranja de dos vasos con cara, muestran que la marca puede ser serena o juguetona sin tocar el logo.',
        images: [cards, poster, apps].map((im, i) => ({...im, _key: `img${i + 1}`})),
      },
    ],
  })
  console.log('Created project-black-coffee (hidden)')
}
run().catch((e) => { console.error(e); process.exit(1) })
