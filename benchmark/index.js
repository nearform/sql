const Benchmark = require('benchmark')
const suite = new Benchmark.Suite()

const SQL1 = require('../SQL')
const SQL2 = require('sql-template-strings')

const username = 'user'
const email = 'user@email.com'
const password = 'Password1'

suite
  .add('@nearform/sql', function () {
    const result = SQL1`INSERT INTO users (username, email, password) VALUES (${username},${email},${password})`
    return result.text
  })
  .add('sql-template-strings', function () {
    SQL2`INSERT INTO users (username, email, password) VALUES (${username},${email},${password})`
  })
  .on('cycle', function (event) {
    console.log(String(event.target))
  })
  .on('complete', function () {
    console.log('The fastest is ' + this.filter('fastest').map('name'))
  })
  .run({ 'async': true })
