const pg = require('pg')
const async = require('async')
const config = require('./config')

config.database = 'postgres'
let client = new pg.Client(config)

function connect (next) {
  client.connect(next)
}

function dropDb (next) {
  client.query(`DROP DATABASE IF EXISTS sqlmap`, function (err) {
    if (err) return next(err)

    next()
  })
}

function createDb (next) {
  client.query('CREATE DATABASE sqlmap', function (err) {
    if (err) return next(err)

    next()
  })
}

function connectToCorrectTable (next) {
  client.end(function () {
    config.database = 'sqlmap'
    client = new pg.Client(config)
    client.connect(next)
  })
}

function initTable (next) {
  client.query('CREATE TABLE users (\n' +
    '  id          SERIAL PRIMARY KEY,\n' +
    '  username    VARCHAR(30) NOT NULL,\n' +
    '  email       VARCHAR(30) NOT NULL,\n' +
    '  password    VARCHAR(30) NOT NULL\n' +
    ')', function (err) {
    if (err) return next(err)

    next()
  })
}

function init (cb) {
  async.series([
    connect,
    dropDb,
    createDb,
    connectToCorrectTable,
    initTable
  ],
  function (err1) {
    if (err1) console.error(err1)
    client.end(function (err2) {
      cb(err1 || err2)
      cb()
    })
  })
}

module.exports = init

if (require.main === module) {
  init((err) => {
    if (err) throw err
    else console.log('Db init: done')
  })
}
