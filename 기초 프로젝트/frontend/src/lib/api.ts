 function toMessage(status: number, payload: any): string {
  if (payload && typeof payload === 'object') {
    if (payload.message && typeof payload.message === 'string') return payload.message
    if (payload.error === 'email_exists') return '이미 등록된 이메일입니다.'
    if (payload.error === 'invalid_credentials' || status === 401) return '이메일 또는 비밀번호가 올바르지 않습니다.'
    if (payload.error === 'validation') return '입력 값을 확인해 주세요.'
  }
  if (status === 400) return '요청 형식이 올바르지 않습니다.'
  if (status === 401) return '인증이 필요합니다.'
  if (status === 409) return '이미 존재하는 데이터입니다.'
  return '요청 처리 중 오류가 발생했습니다.'
}

async function handle<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') || ''
  const isJson = ct.includes('application/json')
  const data = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '')
  if (!res.ok) {
    const msg = toMessage(res.status, data)
    throw new Error(msg)
  }
  return data as T
}

export const api = {
  async get<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, { credentials: 'include', ...init })
    return handle<T>(res)
  },
  async post<T = any>(path: string, body?: any, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
      ...init,
    })
    return handle<T>(res)
  },
  async put<T = any>(path: string, body?: any, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
      ...init,
    })
    return handle<T>(res)
  },
  async delete<T = any>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
      method: 'DELETE',
      credentials: 'include',
      ...init,
    })
    return handle<T>(res)
  },
}
