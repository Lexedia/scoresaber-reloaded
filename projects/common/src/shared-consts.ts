import { env } from './env'
import { isProduction } from './utils/utils'

export const SHARED_CONSTS = {
  maxStars: 15,
  maxFriends: 15,
}

export const SERVER_PROXIES = [
  '', // No proxy
  ...(isProduction() && env.NEXT_PUBLIC_PROXY_URL ? [ env.NEXT_PUBLIC_PROXY_URL ] : []),
]
export const CLIENT_PROXY = env.NEXT_PUBLIC_PROXY_URL ?? 'https://proxy.lexedia.moe/'
