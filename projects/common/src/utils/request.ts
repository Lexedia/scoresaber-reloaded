import { CooldownPriority } from '../cooldown'
import { RateLimitError } from '../error/rate-limit-error'

type RequestReturns = 'text' | 'json' | 'arraybuffer'

type BaseRequestOptions = {
  next?: {
    revalidate?: number;
  };
  searchParams?: Record<string, unknown>;
  throwOnError?: boolean;
  returns?: RequestReturns;
  priority?: CooldownPriority;
}

export type RequestOptions = Omit<RequestInit, 'priority'> & BaseRequestOptions

class Request {
  private static pendingRequests = new Map<string, Promise<unknown>>()
  private static rateLimitInfo = new Map<string, {
    remaining: number;
    resetTime: number
  }>()

  private static getCacheKey(url: string, method: string, options?: RequestOptions): string {
    return JSON.stringify({
      url,
      method,
      options,
    })
  }

  private static buildUrl(baseUrl: string, searchParams?: Record<string, unknown>): string {
    if (!searchParams) {
      return baseUrl
    }

    const params = new URLSearchParams(
      Object.entries(searchParams).map(([
        key,
        value,
      ]) => [
        key,
        String(value),
      ]),
    )
    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}${params.toString()}`
  }

  private static async handleRateLimit(url: string, response: Response): Promise<void> {
    const rateLimit = response.headers.get('x-ratelimit-remaining')
    const resetTime = response.headers.get('x-ratelimit-reset')

    if (rateLimit) {
      const remaining = Number(rateLimit)

      // Update rate limit info
      this.rateLimitInfo.set(url, {
        remaining,
        resetTime: resetTime ? Number(resetTime) : Date.now() + 60_000,
      })

      if (remaining === 0) {
        throw new RateLimitError('Rate limit exceeded')
      }
    }
  }

  public static async executeRequest(
    url: string,
    method: string,
    options?: RequestOptions,
  ): Promise<Response | undefined> {
    const {
      searchParams,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      returns = 'json',
      throwOnError = false,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      priority = CooldownPriority.NORMAL,
      ...fetchOptions
    } = options || {}
    const fullUrl = this.buildUrl(url, searchParams)
    const cacheKey = this.getCacheKey(fullUrl, method, options)

    // Check if there's a pending request for this URL
    const pendingRequest = this.pendingRequests.get(cacheKey)
    if (pendingRequest) {
      const cachedResponse = (await pendingRequest) as Response | undefined
      // Clone the response for each consumer to avoid body consumption issues
      return cachedResponse ? cachedResponse.clone() : undefined
    }

    // Create new request
    const requestPromise = (async () => {
      try {
        const response = await fetch(fullUrl, {
          method,
          ...fetchOptions,
        })

        // Handle rate limits
        await this.handleRateLimit(url, response)

        if (!response.ok) {
          if (throwOnError) {
            throw new Error(
              `Request ${fullUrl} failed with status ${response.status}: ${response.statusText}`,
            )
          }
          return undefined
        }

        return response
      } finally {
        this.pendingRequests.delete(cacheKey)
      }
    })()

    this.pendingRequests.set(cacheKey, requestPromise)
    return requestPromise
  }

  /**
   * Handles the response from the request.
   *
   * @param response the response from the request
   * @param returns the returns type
   * @returns the response
   */
  private static handleResponse<T>(
    response: Response | undefined,
    returns: RequestReturns,
  ): Promise<T | undefined> {
    if (!response) {
      return Promise.resolve(undefined)
    }
    switch (returns) {
      case 'text':
        return response.text() as Promise<T>
      case 'json':
        return response.json() as Promise<T>
      case 'arraybuffer':
        return response.arrayBuffer() as Promise<T>
      default:
        return response.json() as Promise<T>
    }
  }

  public static async get<T>(url: string, options?: RequestOptions): Promise<T | undefined> {
    const response = await this.executeRequest(url, 'GET', options)
    return this.handleResponse<T>(response, options?.returns || 'json')
  }

  public static async post<T>(url: string, options?: RequestOptions): Promise<T | undefined> {
    const response = await this.executeRequest(url, 'POST', options)
    return this.handleResponse<T>(response, options?.returns || 'json')
  }

  public static async put<T>(url: string, options?: RequestOptions): Promise<T | undefined> {
    const response = await this.executeRequest(url, 'PUT', options)
    return this.handleResponse<T>(response, options?.returns || 'json')
  }

  public static async delete<T>(url: string, options?: RequestOptions): Promise<T | undefined> {
    const response = await this.executeRequest(url, 'DELETE', options)
    return this.handleResponse<T>(response, options?.returns || 'json')
  }
}

// Export the public API
export default {
  get: Request.get.bind(Request),
  post: Request.post.bind(Request),
  put: Request.put.bind(Request),
  delete: Request.delete.bind(Request),
  executeRequest: Request.executeRequest.bind(Request),
}
