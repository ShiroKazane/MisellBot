// src/utilities/fuse.ts
import Fuse from "fuse.js"
import card from "./card"
import { normalize } from "./normalize"

// Internal type
type FuseItem = {
  id: number
  name_en?: string | null
  name_ja?: string | null
  aliases?: string[]
  normalized?: string
}

let _fuse: Fuse<FuseItem> | null = null
let _lastBuild = 0
const REBUILD_MS = 60 * 60 * 1000 // hourly

async function buildFuse(): Promise<void> {
  const now = Date.now()
  if (_fuse && now - _lastBuild < REBUILD_MS) return

  await card.load().catch((e) =>
    console.warn("card.load() failed inside fuse builder", e)
  )

  const merged = card.all
  if (!merged || merged.length === 0) {
    _fuse = null
    _lastBuild = now
    return
  }

  const items: FuseItem[] = merged.map((m) => ({
    id: m.id,
    name_en: m.en ?? null,
    name_ja: m.ja ?? null,
    aliases: m.aliases?.length ? m.aliases : undefined,
    normalized: m.normalized,
  }))

  // ================================
  // ⚡ FUSE CONFIG - Stronger & cleaner
  // ================================
  _fuse = new Fuse(items, {
    includeScore: true,
    threshold: 0.33, // TIGHTER to avoid "Purrely → Epurrely Beauty"
    distance: 60,
    ignoreLocation: true,
    minMatchCharLength: 2,

    keys: [
      { name: "name_en", weight: 0.55 },
      { name: "name_ja", weight: 0.45 },
      { name: "aliases", weight: 0.25 },
      { name: "normalized", weight: 0.10 },
    ],
  })

  _lastBuild = now
}

// --------------------------------------------------------
// ⚡ Fuzzy Search (do NOT change signature or shape)
// --------------------------------------------------------
export async function fuzzy(query: string, limit = 8) {
  await buildFuse()

  const q = normalize(query)
  if (!q) {
    return {
      best: null,
      bestId: null,
      score: Infinity,
      candidates: [],
    }
  }

  const merged = card.all ?? []

  // ========================================================
  // 1) STRICT EXACT MATCH for EN/JA (prevents Purrely issue)
  // ========================================================
  for (const m of merged) {
    if (!m || !m.normalized) continue
    if (normalize(m.en ?? "") === q || normalize(m.ja ?? "") === q) {
      const display = m.en ?? m.ja ?? m.aliases?.[0] ?? null
      return { best: display, bestId: m.id, score: 0, candidates: [display] }
    }
  }

  // ========================================================
  // 2) STRICT PREFIX MATCH (very reliable)
  // ========================================================
  for (const m of merged) {
    if (normalize(m.en ?? "").startsWith(q) || normalize(m.ja ?? "").startsWith(q)) {
      const display = m.en ?? m.ja ?? m.aliases?.[0] ?? null
      return { best: display, bestId: m.id, score: 0.01, candidates: [display] }
    }
  }

  // ========================================================
  // 3) SUBSTRING MATCH (stronger than before, still reliable)
  // ========================================================
  for (const m of merged) {
    if (m.normalized?.includes(q)) {
      const display = m.en ?? m.ja ?? m.aliases?.[0] ?? null
      return { best: display, bestId: m.id, score: 0.02, candidates: [display] }
    }

    if (Array.isArray(m.aliases)) {
      for (const a of m.aliases) {
        if (!a) continue
        const an = normalize(a)
        if (an.includes(q)) {
          const display = m.en ?? m.ja ?? a
          return { best: display, bestId: m.id, score: 0.03, candidates: [display] }
        }
      }
    }
  }

  // ========================================================
  // 4) FUSE RESULTS (fine-tuned & strictly filtered)
  // ========================================================
  if (!_fuse) {
    return { best: null, bestId: null, score: Infinity, candidates: [] }
  }

  const results = _fuse.search(q, { limit })
  if (!results.length) {
    return { best: null, bestId: null, score: Infinity, candidates: [] }
  }

  // hard filter: discard weak matches
  const strongOnly = results.filter((r) => r.score !== undefined && r.score <= 0.42)
  const final = strongOnly.length ? strongOnly : results.slice(0, 1)

  const top = final[0]
  const best = top.item
  const display = best.name_en ?? best.name_ja ?? best.aliases?.[0] ?? null

  const candidates = final.map((r) => {
    const it = r.item
    return it.name_en || it.name_ja || it.aliases?.[0] || ""
  }).filter(Boolean)

  return {
    best: display,
    bestId: best.id,
    score: top.score ?? 1,
    candidates,
  }
}
