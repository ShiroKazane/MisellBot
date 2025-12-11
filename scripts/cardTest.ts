// scripts/cardStressTest.ts
import card from '../src/utilities/card'
import { fuzzy } from '../src/utilities/fuse'

const tricky = [
  'exodia',
  'contract with exodia',
  'black luster soldier',
  'purrely',
  'epurrely',
  'blue-eyes',
  'red eyes',
  'dark magician',
  '召喚',
  '天使',
  'ドラゴン'
]

async function run() {
  console.log('Loading card DB...')
  await card.load()
  console.log(`Loaded cards: ${card.all.length}`)
  console.log('---\n')

  const failures: string[] = []

  for (const t of tricky) {
    const r = await fuzzy(t, 5)
    const ok = r.bestId !== null

    if (!ok) {
      failures.push(t)
      console.log(`❌ FAIL: "${t}" → not found`)
      continue
    }

    console.log(`✔ "${t}" → ${r.best} (${r.bestId}) score=${r.score}`)
  }

  // random fuzzy noise
  for (let i = 0; i < 200; i++) {
    const pick = card.all[Math.floor(Math.random() * card.all.length)]
    if (!pick?.en) continue

    const q = mutate(pick.en)
    const r = await fuzzy(q)

    if (!r.bestId) {
      failures.push(q)
      console.log(`❌ Random FAIL: "${q}" should ~ match "${pick.en}"`)
    }
  }

  console.log('\n--- DONE ---')
  if (failures.length)
    console.log('Failures:', failures)
  else
    console.log('All tests OK')
}

function mutate(s: string): string {
  const chars = s.split('')
  const idx = Math.floor(Math.random() * chars.length)
  chars[idx] = '*'
  return chars.join('')
}

run()
