import { Router } from 'express'
import { prisma } from '../prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { authenticate, clearAuthCookie, setAuthCookie, signToken } from '../middleware/auth'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(80)
})

router.post('/register', async (req, res) => {
  try {
    const input = registerSchema.parse(req.body)
    const exists = await prisma.user.findUnique({ where: { email: input.email } })
    if (exists) return res.status(409).json({ error: 'email_exists', message: '이미 등록된 이메일입니다.' })
    const hash = await bcrypt.hash(input.password, 10)
    const user = await prisma.user.create({ data: { email: input.email, passwordHash: hash, name: input.name } })
    const token = signToken(user.id)
    setAuthCookie(res, token)
    return res.status(201).json({ id: user.id, email: user.email, name: user.name })
  } catch (e: any) {
    // Zod validation friendly messages
    if (e?.name === 'ZodError' && Array.isArray(e.issues)) {
      const mapIssue = (iss: any) => {
        const path = (iss.path && iss.path[0]) || ''
        if (path === 'password') return '비밀번호는 6자 이상이어야 합니다.'
        if (path === 'email') return '이메일 형식이 올바르지 않습니다.'
        if (path === 'name') return '이름을 입력해 주세요.'
        return '입력 값을 확인해 주세요.'
      }
      return res.status(400).json({ error: 'validation', message: mapIssue(e.issues[0]), issues: e.issues })
    }
    return res.status(400).json({ error: 'bad_request', message: '요청 형식이 올바르지 않습니다.' })
  }
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

router.post('/login', async (req, res) => {
  try {
    const input = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user) return res.status(401).json({ error: 'invalid_credentials' })
    const ok = await bcrypt.compare(input.password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' })
    const token = signToken(user.id)
    setAuthCookie(res, token)
    return res.json({ id: user.id, email: user.email, name: user.name })
  } catch (e: any) {
    if (e?.name === 'ZodError' && Array.isArray(e.issues)) {
      const path = (e.issues[0]?.path && e.issues[0].path[0]) || ''
      const message = path === 'password' ? '비밀번호는 6자 이상이어야 합니다.' : '입력 값을 확인해 주세요.'
      return res.status(400).json({ error: 'validation', message, issues: e.issues })
    }
    return res.status(400).json({ error: 'bad_request', message: '요청 형식이 올바르지 않습니다.' })
  }
})

router.post('/logout', (_req, res) => {
  clearAuthCookie(res)
  return res.json({ ok: true })
})

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { id: true, email: true, name: true } })
  return res.json(user)
})

export default router
