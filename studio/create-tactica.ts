// Creates the "Táctica" case (chess-tactics trainer) — HIDDEN from the index
// until Jose approves it (hidden: true; the page works at /work/tactica).
// Media made from the app with a demo player (no real users): see session notes.
// Run with: npx sanity exec create-tactica.ts --with-user-token
import {readFileSync} from 'fs'
import {getCliClient} from 'sanity/cli'

const client = getCliClient()
const MEDIA = '/private/tmp/claude-502/-Users-josepelaez/3dad3fc2-ca49-4d5f-8b03-1be70721ca0f/scratchpad/tactica/out'
const ref = (id: string) => ({_type: 'reference' as const, _ref: id})
const img = async (file: string, alt?: string, altEs?: string) => {
  const a = await client.assets.upload('image', readFileSync(`${MEDIA}/${file}`), {filename: file})
  return {_type: 'image' as const, asset: ref(a._id), ...(alt ? {alt, altEs} : {})}
}

async function run() {
  console.log('Uploading media...')
  const hero = await img('tactica-hero.png')
  const video = await client.assets.upload('file', readFileSync(`${MEDIA}/tactica-solve.mp4`), {filename: 'tactica-solve.mp4', contentType: 'video/mp4'})
  const [dailyStats, rank, directions] = await Promise.all([
    img('tactica-daily-stats.png', 'Daily challenge and stats screens', 'Pantallas de reto diario y estadísticas'),
    img('tactica-rank.png', 'Global ranking and the board', 'Ranking global y el tablero'),
    img('tactica-directions.png', 'Three design directions side by side: the first version, a study notebook and a minimal one', 'Tres direcciones de diseño: la primera versión, un cuaderno de estudio y una minimal'),
  ])
  const k = (n: string) => n
  await client.createOrReplace({
    _id: 'project-tactica',
    _type: 'project',
    title: 'Táctica',
    slug: {_type: 'slug', current: 'tactica'},
    hidden: true,
    order: 4.3,
    category: 'Web',
    description: 'An adaptive chess-tactics trainer, designed and built end to end: puzzles at your level, a daily challenge, leagues with friends and a ranking.',
    descriptionEs: 'Un entrenador de táctica de ajedrez adaptativo, diseñado y desarrollado de principio a fin: problemas a tu nivel, reto diario, ligas con amigos y ranking.',
    tags: ['Product Design', 'Web App'],
    tagsEs: ['Diseño de producto', 'Web app'],
    cover: hero,
    coverVideo: {_type: 'file', asset: ref(video._id)},
    hero,
    liveUrl: 'https://tactica-ajedrez.vercel.app',
    role: 'Design & development',
    roleEs: 'Diseño y desarrollo',
    team: 'Solo',
    teamEs: 'En solitario',
    timeline: '2026 — self-initiated',
    timelineEs: '2026 — proyecto propio',
    sections: [
      {
        _key: k('context'), _type: 'sectionBlock', label: 'Context', labelEs: 'Contexto',
        body: 'Táctica is a self-initiated product: a chess-tactics trainer that serves puzzles at your level, one after another, with nothing in the way. I designed and built it end to end, from the board to the accounts, on top of some 48,000 open puzzles from Lichess.',
        bodyEs: 'Táctica es un producto propio: un entrenador de táctica de ajedrez que sirve problemas a tu nivel, uno tras otro, sin nada en medio. Lo diseñé y desarrollé de principio a fin, del tablero a las cuentas, sobre unos 48.000 problemas abiertos de Lichess.',
        video: {_type: 'file', asset: ref(video._id)},
      },
      {
        _key: k('problem'), _type: 'sectionBlock', label: 'Problem', labelEs: 'Problema',
        body: 'Puzzle trainers tend to bury the board under menus, stats and upsells. The brief I set myself: open it and be solving within a second, on any phone, with a reason to come back every day, all on free-tier infrastructure.',
        bodyEs: 'Los entrenadores de problemas suelen enterrar el tablero bajo menús, estadísticas y ventas. Me puse un encargo: abrirlo y estar resolviendo en un segundo, en cualquier móvil, con un motivo para volver cada día, y todo sobre infraestructura gratuita.',
      },
      {
        _key: k('solution'), _type: 'sectionBlock', label: 'Solution', labelEs: 'Solución',
        body: 'A board-first app: the puzzle fills the screen and four tabs do the rest. Difficulty adapts to every answer, failed puzzles come back, and a daily challenge, leagues with friends and achievements give each day a goal.\n\nAlong the way I tried two redesigns, a study notebook and a minimal one, and went back to the first: it was the one that felt best to play.',
        bodyEs: 'Una app en la que manda el tablero: el problema ocupa la pantalla y cuatro pestañas hacen el resto. La dificultad se adapta a cada respuesta, los problemas fallados vuelven, y el reto diario, las ligas con amigos y los logros dan a cada día un objetivo.\n\nPor el camino probé dos rediseños, un cuaderno de estudio y uno minimal, y volví al primero: era el que mejor se sentía al jugar.',
        images: [dailyStats, rank, directions].map((im, i) => ({...im, _key: `img${i + 1}`})),
      },
    ],
  })
  console.log('Created project-tactica (hidden)')
}
run().catch((e) => { console.error(e); process.exit(1) })
