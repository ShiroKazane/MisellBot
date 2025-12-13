import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { request } from 'undici'
import { normalize, tokenize } from './normalize'

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export type RawCard = {
  id?: number
  name?: string
  aliases?: string[]
  [k: string]: any
}

export interface MergedCard {
  id: number
  en?: string | null
  ja?: string | null
  aliases: string[]
  normalized: string
  tokens: string[]
  rawEn?: RawCard
  rawJa?: RawCard
}

// -----------------------------------------------------------
// Internal state
// -----------------------------------------------------------

let loaded = false
let allCards: MergedCard[] = []
let enCards: RawCard[] = []
let jaCards: RawCard[] = []

// -----------------------------------------------------------
// Safe JSON helper
// -----------------------------------------------------------

function jsonDecode(x: unknown): any | null {
  return typeof x === 'object' && x !== null ? x : null
}

// -----------------------------------------------------------
// Load card data
// -----------------------------------------------------------

async function load(): Promise<void> {
  if (loaded) return

  // ---- Load EN ----
  try {
    const { body } = await request('https://db.ygoprodeck.com/api/v7/cardinfo.php')
    const raw = jsonDecode(await body.json())
    if (raw && Array.isArray(raw.data)) enCards = raw.data
  } catch (err) {
    console.error('Failed EN list:', err)
  }

  // ---- Load JA ----
  try {
    const { body } = await request('https://db.ygoprodeck.com/api/v7/cardinfo.php?language=ja')
    const raw = jsonDecode(await body.json())
    if (raw && Array.isArray(raw.data)) jaCards = raw.data
  } catch (err) {
    console.warn('Failed JA list:', err)
  }

  // -----------------------------------------------------------
  // Merge EN + JA by ID
  // -----------------------------------------------------------

  const map = new Map<number, MergedCard>()

  for (const c of enCards) {
    if (!c || typeof c.id !== 'number') continue
    const norm = normalize(c.name ?? '')

    map.set(c.id, {
      id: c.id,
      en: c.name ?? null,
      ja: null,
      aliases: Array.isArray(c.aliases) ? [...c.aliases] : [],
      normalized: norm,
      tokens: tokenize(norm),
      rawEn: c,
    })
  }

  for (const c of jaCards) {
    if (!c || typeof c.id !== 'number') continue
    const norm = normalize(c.name ?? '')

    const existing = map.get(c.id)

    if (existing) {
      // merge JA into existing
      existing.ja = c.name ?? null
      const extraAliases = Array.isArray(c.aliases) ? c.aliases : []
      existing.aliases = [...new Set([...existing.aliases, ...extraAliases])]

      const mergedNorm = `${existing.normalized.trim()} ${norm.trim()}`
      existing.normalized = normalize(mergedNorm)
      existing.tokens = tokenize(existing.normalized)
      existing.rawJa = c
    } else {
      // JA-only card
      map.set(c.id, {
        id: c.id,
        en: null,
        ja: c.name ?? null,
        aliases: Array.isArray(c.aliases) ? [...c.aliases] : [],
        normalized: norm,
        tokens: tokenize(norm),
        rawEn: undefined,
        rawJa: c,
      })
    }
  }

  allCards = [...map.values()]
  loaded = true
}

// -----------------------------------------------------------
// Image downloading
// -----------------------------------------------------------

const TEMP = join(process.cwd(), 'temp')
const EXPIRE = 24 * 60 * 60 * 1000

async function ensureDir() {
  await mkdir(TEMP, { recursive: true })
}

async function clean() {
  try {
    await ensureDir()
    const files = await readdir(TEMP)
    const now = Date.now()

    await Promise.all(
      files.map(async (f) => {
        const full = join(TEMP, f)
        if (full.includes('.gitkeep')) return
        try {
          const info = await stat(full)
          if (now - info.mtimeMs > EXPIRE) {
            await unlink(full).catch(() => {})
          }
        } catch {}
      })
    )
  } catch {}
}

async function image(url: string, fileName: string) {
  await ensureDir()
  await clean()

  const safeName = fileName.replace(/[^\w.-]/g, '_')
  const path = join(TEMP, safeName)

  const { body, statusCode } = await request(url)
  if (statusCode && statusCode >= 400) {
    throw new Error(`HTTP ${statusCode}`)
  }

  const buffer = Buffer.from(await body.arrayBuffer())
  await writeFile(path, buffer)
  return path
}

export default {
  load,
  image,
  clean,
  get en() {
    return enCards
  },
  get ja() {
    return jaCards
  },
  get all() {
    return allCards
  },
}
