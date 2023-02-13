const users = require('./users')
const table = require('./table')

const fastify = require('fastify')({
  logger: false
})

fastify.register(require('@fastify/postgres'), require('./config'))
fastify.register(users)
fastify.register(table)

const start = async () => {
  try {
    await fastify.listen({ port: 8080 })
    // it's important to write to stdout as the sqlmap script relies on
    // a message from the server to be printed on stdout to start the checks
    console.log('Server started')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
