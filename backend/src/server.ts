import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import autoload from '@fastify/autoload'
import type { Env } from './schema/env'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export interface BuildServerOptions {
  config: Env
  trustProxy?: boolean | string
}

export function buildServer({ config, trustProxy }: BuildServerOptions) {
  const envToLogger = {
    development: {
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    production: {
      level: config.LOG_LEVEL,
    },
    test: {
      level: 'silent',
    },
  } as const

  const server = Fastify({
    logger: envToLogger[config.NODE_ENV],
    trustProxy: trustProxy ?? false,
    requestTimeout: 120_000,
    bodyLimit: 1_048_576,
    return503OnClosing: true,
    forceCloseConnections: 'idle',
    onProtoPoisoning: 'error',
    onConstructorPoisoning: 'error',
  })

  // Shared plugins. Each plugin uses fastify-plugin and may depend on config.
  server.register(autoload, {
    dir: path.join(__dirname, 'plugins'),
    options: { config },
  })

  // Routes stay encapsulated. Folder names become URL prefixes.
  server.register(autoload, {
    dir: path.join(__dirname, 'routes'),
    autoHooks: true,
    cascadeHooks: true,
  })

  return server
}
