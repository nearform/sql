'use strict'

const { test, before, after } = require('node:test')
const { withPg, createUsersTable } = require('./helpers/db')
const runFeatureSuite = require('./shared/featureSuite')

const ctx = { db: null }

before(async () => {
  ctx.db = await withPg()
  await createUsersTable(ctx.db)
})

after(async () => {
  if (ctx.db) await ctx.db.end()
})

runFeatureSuite(test, () => ctx.db)
