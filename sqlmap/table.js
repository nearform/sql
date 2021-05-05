const SQL = require('../SQL')
const quoteIdent = SQL.quoteIdent

module.exports = async function (fastify) {
  fastify.post('/table', async request => {
    const { tableName, field1, field2 } = request.body

    await fastify.pg.query(
      SQL`CREATE TABLE ${quoteIdent(tableName)} (
        ${quoteIdent(field1)} SERIAL PRIMARY KEY, 
        ${quoteIdent(field2)} VARCHAR (30)
      )`
    )

    return fastify.pg.query(SQL`DROP TABLE ${quoteIdent(tableName)} `)
  })
}
