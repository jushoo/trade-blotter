import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { fromNodeHeaders } from 'better-auth/node'
import { auth, type Session, type User } from '../lib/auth'

declare module 'fastify' {
  interface FastifyInstance {
    auth: typeof auth
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  interface FastifyRequest {
    session: Session | null
    user: User | null
  }
}

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate('auth', auth)

  fastify.decorate('authenticate', async function (
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const result = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    })

    if (!result) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    request.session = result.session
    request.user = result.user
  })

  // Mount Better Auth routes. Build a Fetch Request from the Fastify request
  // and forward the response through the normal reply pipeline, so Fastify
  // hooks (CORS, serialization) still run. See:
  // https://better-auth.com/docs/integrations/fastify
  fastify.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      try {
        const url = new URL(
          request.url,
          `${request.protocol}://${request.headers.host}`,
        )
        const headers = fromNodeHeaders(request.headers)
        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          ...(request.body !== undefined
            ? { body: JSON.stringify(request.body) }
            : {}),
        })

        const response = await auth.handler(req)

        reply.status(response.status)
        response.headers.forEach((value, key) => {
          if (key === 'set-cookie') return
          reply.header(key, value)
        })
        const setCookies = response.headers.getSetCookie()
        if (setCookies.length > 0) {
          reply.header('set-cookie', setCookies)
        }

        return reply.send(response.body ? await response.text() : null)
      } catch (error) {
        fastify.log.error({ err: error }, 'authentication error')
        return reply.status(500).send({
          error: 'Internal authentication error',
          code: 'AUTH_FAILURE',
        })
      }
    },
  })
}

export default fp(authPlugin, {
  name: 'auth',
})
