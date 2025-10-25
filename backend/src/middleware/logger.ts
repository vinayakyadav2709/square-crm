import type { Context, Next } from 'hono'

export const logger = async (c: Context, next: Next) => {
  const start = Date.now()
  const { method, url } = c.req

  console.log(`➡️  ${method} ${url}`)

  await next()

  const ms = Date.now() - start
  const status = c.res.status

  const statusEmoji = status >= 500 ? '❌' 
    : status >= 400 ? '⚠️' 
    : status >= 300 ? '↩️' 
    : '✅'

  console.log(`${statusEmoji} ${method} ${url} - ${status} [${ms}ms]`)
}
