// Google Custom Search (Image) helper for menu photos
// Requires env: VITE_GOOGLE_CSE_KEY, VITE_GOOGLE_CSE_CX

type CseItem = {
  link?: string
  title?: string
  image?: { width?: number; height?: number; thumbnailLink?: string }
}

function scoreMenuCandidate(it: CseItem): number {
  const w = Number(it.image?.width || 0)
  const h = Number(it.image?.height || 0)
  const ratio = w && h ? w / Math.max(1, h) : 1
  let s = 0
  if (w >= 600) s += 1
  if (w >= 1000) s += 1
  if (ratio >= 0.6 && ratio <= 1.4) s += 2 // menu board often portrait/square-ish
  const t = (it.title || '')
  const link = (it.link || '')
  const hasMenuWord = /(menu|메뉴)/i
  const hasPriceWord = /(price|가격)/i
  if (hasMenuWord.test(t)) s += 2
  if (hasMenuWord.test(link) || hasPriceWord.test(link)) s += 1
  return s
}

export async function fetchMenuImageForPlace(placeName: string, address?: string): Promise<string | null> {
  const key = import.meta.env?.VITE_GOOGLE_CSE_KEY as string | undefined
  const cx = import.meta.env?.VITE_GOOGLE_CSE_CX as string | undefined
  if (!key || !cx) return null

  const qs = [
    [placeName, address, '메뉴'].filter(Boolean).join(' ').trim(),
    `${placeName} 메뉴`,
    `${placeName} menu`,
  ]

  const run = async (q: string) => {
    const url = `https://www.googleapis.com/customsearch/v1?searchType=image&num=10&safe=active&q=${encodeURIComponent(q)}&key=${key}&cx=${cx}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const items: CseItem[] = data?.items || []
    let best: { score: number; link: string } | null = null
    for (const it of items) {
      if (!it.link) continue
      const sc = scoreMenuCandidate(it)
      if (!best || sc > best.score) best = { score: sc, link: it.link }
    }
    return best?.link || null
  }

  for (const q of qs) {
    try {
      const u = await run(q)
      if (u) return u
    } catch { /* noop */ }
  }
  return null
}

