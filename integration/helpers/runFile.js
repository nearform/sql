'use strict'

const { test, before, after } = require('node:test')
const { createUsersTable } = require('./db')
const runFeatureSuite = require('../shared/featureSuite')

// Wires the connection lifecycle for one driver's integration test file:
// open the connection and create a fresh table before the suite, close it
// after, then register the shared feature suite. `connect` is one of the
// withPg/withMysql/withMysql2 adapters from helpers/db.js.
module.exports = function runIntegrationFile (connect) {
  const ctx = { db: null }

  before(async () => {
    ctx.db = await connect()
    await createUsersTable(ctx.db)
  })

  after(async () => {
    if (ctx.db) await ctx.db.end()
  })

  runFeatureSuite(test, () => ctx.db)
}
