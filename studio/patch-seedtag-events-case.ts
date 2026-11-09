// Seedtag Events case, in the final case structure (as ISOLA and Táctica):
// three sections — Context, Problem, Solution — of a few lines each, with
// clips recorded from the app on a demo event (made-up event and guests).
//   Context  — the landing, scrolled (also the cover video)
//   Problem  — the events list
//   Solution — the editor typing into the live preview + the event hub
// Revert: restore backup-seedtag-events-2026-11-09.json (the doc before this).
// Run with: npx sanity exec patch-seedtag-events-case.ts --with-user-token
import {readFileSync} from 'fs'
import {getCliClient} from 'sanity/cli'

const client = getCliClient()
const MEDIA = `${process.cwd()}/media/seedtag-events` // run from studio/
const ref = (id: string) => ({_type: 'reference' as const, _ref: id})
const video = async (file: string) => {
  const a = await client.assets.upload('file', readFileSync(`${MEDIA}/${file}`), {filename: `seedtag-events-${file}`, contentType: 'video/mp4'})
  return {_type: 'file' as const, asset: ref(a._id)}
}

async function run() {
  console.log('Uploading media...')
  const [landing, editor, hub] = await Promise.all([video('se-landing.mp4'), video('se-editor.mp4'), video('se-hub.mp4')])
  const list = await client.assets.upload('image', readFileSync(`${MEDIA}/problem-list.png`), {filename: 'seedtag-events-list.png'})

  await client
    .patch('project-seedtag-events')
    .set({
      coverVideo: landing,
      sections: [
        {
          _key: 'context', _type: 'sectionBlock', label: 'Context', labelEs: 'Contexto',
          body: "Seedtag's marketing team runs client dinners, meetups and summits in several countries. Each one needs a landing page, an invitation, a registration form and a guest list, and until now every page was built one by one, outside the team.",
          bodyEs: 'El equipo de marketing de Seedtag organiza cenas con clientes, encuentros y summits en varios países. Cada uno necesita una landing, una invitación, un formulario de registro y una lista de invitados, y hasta ahora cada página se hacía una a una, fuera del equipo.',
          video: landing,
        },
        {
          _key: 'problem', _type: 'sectionBlock', label: 'Problem', labelEs: 'Problema',
          body: "The people who knew each event best couldn't touch its page. Dates and agendas changed until the last day, and the guest list lived in spreadsheets that never matched the registrations. The brief: full control for a non-technical team, without ever drifting off-brand.",
          bodyEs: 'Quienes mejor conocían cada evento no podían tocar su página. Fechas y agendas cambiaban hasta el último día, y la lista de invitados vivía en hojas de cálculo que nunca cuadraban con los registros. El reto: control total para un equipo no técnico, sin salirse nunca de la marca.',
          images: [{
            _key: 'list', _type: 'image', asset: ref(list._id),
            alt: 'The events list: every event with its date, country, creator and status (demo data)',
            altEs: 'La lista de eventos: cada evento con su fecha, país, autor y estado (datos de demostración)',
          }],
        },
        {
          _key: 'solution', _type: 'sectionBlock', label: 'Solution', labelEs: 'Solución',
          body: "Fixed sections designed once in Seedtag's visual language, so any combination still looks like Seedtag. An editor with the real landing beside the form, updating as you type. And one hub per event: invitation, registration and a QR pass for the door, with every guest in a single table.\n\nPiloted with the marketing team in October 2026. The event and guests shown are made up.",
          bodyEs: 'Secciones fijas diseñadas una vez en el lenguaje visual de Seedtag, para que cualquier combinación siga pareciendo Seedtag. Un editor con la landing real junto al formulario, que cambia mientras escribes. Y un panel por evento: invitación, registro y un pase QR para la puerta, con todos los invitados en una sola tabla.\n\nPilotado con el equipo de marketing en octubre de 2026. El evento y los invitados que se ven son inventados.',
          video: editor,
          video2: hub,
        },
      ],
    })
    .commit()
  console.log('project-seedtag-events: 3 sections, cover video and clips set')
}
run().catch((e) => { console.error(e); process.exit(1) })
