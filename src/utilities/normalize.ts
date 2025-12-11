// src/utilities/normalize.ts
export function normalize(s: string): string {
  if (!s) return ''
  return s
    .toLowerCase()
    .replace(/[\u2010-\u201F\u3000-\u303F\p{P}\p{S}]+/gu, ' ')
    .replace(/[^\p{L}\p{N}\s\u3040-\u30ff\u4e00-\u9faf]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenize(norm: string): string[] {
  if (!norm) return []
  return norm.split(' ').filter(Boolean)
}
