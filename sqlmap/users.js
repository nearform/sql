const SQL = require('../SQL')

module.exports = async function (fastify) {
  fastify.get('/users', async request => {
    const { limit = 10, page = 1 } = request.query

    const { rows: users } = await fastify.pg.query(
      SQL`SELECT * FROM users LIMIT ${limit} OFFSET ${limit * (page - 1)}`
    )

    return users
  })

  fastify.post('/users', async (request, reply) => {
    const { username, password, email } = request.body

    const result = await fastify.pg.query(
      SQL`INSERT INTO users (username, email, password) VALUES (${username},${email},${password})`
    )

    if (result.command !== 'INSERT' || result.rowCount !== 1) {
      throw new Error('User was not inserted')
    }

    return reply.code(201).send()
  })
}
