const { Client } = require('pg')
const SQL = require('../SQL')
const config = require('./config')

module.exports = {
  name: 'users',
  version: '1.0.0',
  register: function (server) {
    const client = new Client(config)
    return client.connect().then(() => {
      server.route({
        method: 'GET',
        path: '/users',
        handler: function (request, h) {
          const { limit = 10, page = 1 } = request.query

          return client.query(SQL`SELECT * FROM users LIMIT ${limit} OFFSET ${limit * (page - 1)}`)
            .then((users) => {
              const response = h.response(users)
              response.code(201)
              return response
            })
        }
      })

      server.route({
        method: 'POST',
        path: '/users',
        handler: function (request, h) {
          const { username, password, email } = request.payload

          return client.query(SQL`INSERT INTO users (username, email, password) VALUES (${username},${email},${password})`)
            .then((user) => {
              const response = h.response(user)
              response.code(201)
              return response
            })
        }
      })
    })
  }
}
