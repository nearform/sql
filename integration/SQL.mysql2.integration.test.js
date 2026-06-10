'use strict'

const { withMysql2 } = require('./helpers/db')
const runIntegrationFile = require('./helpers/runFile')

runIntegrationFile(withMysql2)
