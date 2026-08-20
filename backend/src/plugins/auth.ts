import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
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

  // Mount Better Auth routes. Fastify consumes the body stream, so restore the
  // parsed body onto the raw request for better-call before hijacking.
  fastify.all('/api/auth/*', async (request, reply) => {
    // `reply.hijack()` bypasses the reply pipeline, so @fastify/cors never runs
    // its onSend hook for these responses. Emit the CORS headers manually.
    const allowedOrigins = fastify.config.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
    const origin = request.headers.origin
    if (origin && allowedOrigins.includes(origin)) {
      reply.raw.setHeader('Access-Control-Allow-Origin', origin)
      reply.raw.setHeader('Access-Control-Allow-Credentials', 'true')
      reply.raw.setHeader('Vary', 'Origin')
    }

    ;(request.raw as unknown as { body?: unknown }).body = request.body
    reply.hijack()
    await toNodeHandler(auth)(request.raw, reply.raw)
  })
}

export default fp(authPlugin, {
  name: 'auth',
})
