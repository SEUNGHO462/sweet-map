import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'sm_token'

export function signToken(userId: string) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' })
}

export function setAuthCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

export function authenticate(req: Request & { userId?: string }, res: Response, next: NextFunction) {
  try {
    const token = (req.cookies && req.cookies[COOKIE_NAME]) || undefined
    if (!token) return res.status(401).json({ error: 'unauthorized' })
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET is not set')
    const payload = jwt.verify(token, secret) as { sub: string }
    req.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }
}

