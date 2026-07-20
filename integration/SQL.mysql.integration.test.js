'use strict'

const { withMysql } = require('./helpers/db')
const runIntegrationFile = require('./helpers/runFile')

runIntegrationFile(withMysql)
