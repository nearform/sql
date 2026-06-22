'use strict'

const { withPg } = require('./helpers/db')
const runIntegrationFile = require('./helpers/runFile')

runIntegrationFile(withPg)
