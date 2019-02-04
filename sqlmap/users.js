const { Client } = require('pg')
const { PG } = require('../SQL')
const config = require('./config')

const client = new Client(config)
client.connect()

exports.register = function (server, options, next) {
  server.route({
    method: 'GET',
    path: '/users',
    handler: function (request, reply) {
      const { limit = 10, page = 1 } = request.query

      client.query(PG`SELECT * FROM users LIMIT ${limit} OFFSET ${limit * (page - 1)}`, (err, users) => {
        if (err) {
          return reply(err)
        }

        return reply(users).code(201)
      })
    }
  })

  server.route({
    method: 'POST',
    path: '/users',
    handler: function (request, reply) {
      const { username, password, email } = request.payload

      client.query(PG`INSERT INTO users (username, email, password) VALUES (${username},${email},${password})`, (err, user) => {
        if (err) {
          return reply(err)
        }

        return reply(user).code(201)
      })
    }
  })

  next()
}

exports.register.attributes = {
  name: 'users'
}
