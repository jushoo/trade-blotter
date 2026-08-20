import 'dotenv/config'
import closeWithGrace from 'close-with-grace'
import { envSchema } from './schema/env'
import { buildServer } from './server'

const config = envSchema.parse(process.env)
const server = buildServer({ config })

closeWithGrace({ delay: 10_000 }, async ({ signal, err }) => {
  if (err) {
    server.log.error({ err }, 'server closing with error')
  } else {
    server.log.info(`${signal} received, server closing`)
  }
  await server.close()
})

try {
  await server.listen({ port: config.PORT, host: config.HOST })
} catch (error) {
  server.log.fatal(error)
  process.exit(1)
}
