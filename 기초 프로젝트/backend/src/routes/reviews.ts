import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma'
import { authenticate, maybeAuthenticate } from '../middleware/auth'

const router = Router()

router.get('/', maybeAuthenticate, async (req: any, res) => {
  const idsParam = (req.query.cafeIds as string | undefined) || (req.query.cafeId as string | undefined)
  const whereClause: any = {}
  if (idsParam) {
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean)
    if (ids.length) {
      whereClause.cafeId = { in: ids.map(v => BigInt(v)) }
    }
  }
  const rows = await prisma.review.findMany({
    where: whereClause,
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  const viewerId = req.userId
  return res.json(rows.map(r => ({
    id: r.id,
    cafeId: Number(r.cafeId),
    rating: r.rating,
    text: r.text,
    photoUrl: r.photoUrl,
    createdAt: r.createdAt,
    authorName: r.user?.name || 'Guest',
    authorId: r.userId,
    canDelete: Boolean(viewerId && viewerId === r.userId),
  })))
})

const createSchema = z.object({
  cafe_id: z.union([z.number().int(), z.string()]).transform(v => Number(v)),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1),
})

router.post('/', authenticate, async (req: any, res) => {
  try {
    const input = createSchema.parse(req.body)
    const saved = await prisma.review.create({
      data: {
        userId: req.userId,
        cafeId: BigInt(input.cafe_id),
        rating: input.rating,
        text: input.text,
      }
    })
    const result = await prisma.review.findUnique({
      where: { id: saved.id },
      include: { user: { select: { name: true } } },
    })
    if (!result) return res.status(201).json(saved)
    return res.status(201).json({
      id: result.id,
      cafeId: Number(result.cafeId),
      rating: result.rating,
      text: result.text,
      photoUrl: result.photoUrl,
      createdAt: result.createdAt,
      authorName: result.user?.name || 'Guest',
      authorId: result.userId,
      canDelete: true,
    })
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'bad_request' })
  }
})

router.delete('/:id', authenticate, async (req: any, res) => {
  const { id } = req.params
  if (!id) return res.status(400).json({ error: 'missing_id' })
  const review = await prisma.review.findUnique({ where: { id } })
  if (!review) return res.status(404).json({ error: 'not_found' })
  if (review.userId !== req.userId) return res.status(403).json({ error: 'forbidden' })
  await prisma.review.delete({ where: { id } })
  return res.json({ ok: true })
})

export default router
