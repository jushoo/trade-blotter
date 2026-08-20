import fp from 'fastify-plugin'
import type { FastifyError, FastifyInstance } from 'fastify'

async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler(async (error: FastifyError, request, reply) => {
    request.log.error(error)

    if (error.validation) {
      reply.status(400)
      return { error: error.message }
    }

    const statusCode = error.statusCode ?? 500
    reply.status(statusCode)

    if (statusCode >= 500) {
      return { error: 'Internal Server Error' }
    }
    return { error: error.message }
  })

  fastify.setNotFoundHandler(async (request, reply) => {
    reply.status(404)
    return { error: `Route ${request.method} ${request.url} not found` }
  })
}

export default fp(errorHandlerPlugin, {
  name: 'error-handler',
})
