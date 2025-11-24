import { Router } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { prisma } from '../prisma'
import { authenticate } from '../middleware/auth'

const router = Router()

const planItemSchema = z.object({
  id: z.string().min(1).optional(),
  text: z.string().min(1),
  done: z.boolean().optional(),
  order: z.number().int().optional(),
})

const planSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1),
  cafeId: z.number().int().optional().nullable(),
  date: z.string().optional().nullable(),
  timeText: z.string().optional().nullable(),
  items: z.array(planItemSchema).optional(),
})

const syncSchema = z.object({
  plans: z.array(planSchema),
})

router.use(authenticate)

const mapPlan = (plan: any) => ({
  id: plan.id,
  title: plan.title,
  cafeId: plan.cafeId ? Number(plan.cafeId) : null,
  date: plan.date,
  timeText: plan.timeText,
  createdAt: plan.createdAt,
  items: plan.items?.map((item: any) => ({
    id: item.id,
    text: item.text,
    done: item.done,
    order: item.orderIndex,
  })) || [],
})

router.get('/', async (req: any, res) => {
  const rows = await prisma.plan.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'asc' },
    include: { items: { orderBy: { orderIndex: 'asc' } } },
  })
  return res.json(rows.map(mapPlan))
})

router.put('/sync', async (req: any, res) => {
  const { plans } = syncSchema.parse(req.body)
  await prisma.$transaction(async (tx) => {
    const incoming = plans.map((plan) => ({
      ...plan,
      id: plan.id || randomUUID(),
    }))
    const ids = incoming.map((p) => p.id)
    await tx.plan.deleteMany({
      where: {
        userId: req.userId,
        id: { notIn: ids },
      },
    })
    for (const plan of incoming) {
      await tx.plan.upsert({
        where: { id: plan.id },
        create: {
          id: plan.id,
          userId: req.userId,
          title: plan.title,
          cafeId: plan.cafeId ? BigInt(plan.cafeId) : null,
          date: plan.date ? new Date(plan.date) : null,
          timeText: plan.timeText || null,
        },
        update: {
          title: plan.title,
          cafeId: plan.cafeId ? BigInt(plan.cafeId) : null,
          date: plan.date ? new Date(plan.date) : null,
          timeText: plan.timeText || null,
        },
      })
      await tx.planItem.deleteMany({ where: { planId: plan.id } })
      if (plan.items?.length) {
        await tx.planItem.createMany({
          data: plan.items.map((item, index) => ({
            id: item.id || randomUUID(),
            planId: plan.id,
            text: item.text,
            done: item.done ?? false,
            orderIndex: item.order ?? index,
          })),
        })
      }
    }
  })
  const rows = await prisma.plan.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'asc' },
    include: { items: { orderBy: { orderIndex: 'asc' } } },
  })
  return res.json(rows.map(mapPlan))
})

export default router
