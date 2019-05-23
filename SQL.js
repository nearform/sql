'use strict'
const inspect = Symbol.for('nodejs.util.inspect.custom')
const assert = require('assert')

class SqlStatement {
  constructor (strings, values) {
    assert(
      values.every(value => value !== undefined),
      'SQL`...` strings cannot take `undefined` as values as this can generate invalid sql.'
    )
    this.strings = strings
    this.values = values
  }

  glue (pieces, separator) {
    const result = { strings: [], values: [] }

    let carryover
    for (let i = 0; i < pieces.length; i++) {
      let strings = Array.from(pieces[i].strings)
      if (typeof carryover === 'string') {
        strings[0] = carryover + separator + strings[0]
        carryover = null
      }

      if (strings.length > pieces[i].values.length) {
        carryover = strings.splice(-1)[0]
      }
      result.strings = result.strings.concat(strings)
      result.values = result.values.concat(pieces[i].values)
    }
    if (typeof carryover === 'string') {
      result.strings.push(carryover)
    }

    if (result.strings.length === result.values.length) {
      result.strings.push('')
    }

    result.strings[result.strings.length - 1] += ' '

    return new SqlStatement(
      result.strings,
      result.values
    )
  }

  generateString (type) {
    let text = this.strings[0]

    for (var i = 1; i < this.strings.length; i++) {
      let delimiter = '?'
      if (type === 'pg') {
        delimiter = '$' + i
      }

      text += delimiter + this.strings[i]
    }

    return text
      .replace(/\s+$/mg, ' ')
      .replace(/^\s+|\s+$/mg, '')
  }

  get debug () {
    let text = this.strings[0]
    let data
    for (var i = 1; i < this.strings.length; i++) {
      data = this.values[i - 1]
      typeof data === 'string' ? text += "'" + data + "'" : text += data
      text += this.strings[i]
    }

    return text
      .replace(/\s+$/mg, ' ')
      .replace(/^\s+|\s+$/mg, '')
  }

  [inspect] () {
    return `SQL << ${this.debug} >>`
  }

  get text () {
    return this.generateString('pg')
  }

  get sql () {
    return this.generateString('mysql')
  }

  append (statement, options) {
    if (!statement) {
      return this
    }

    if (!(statement instanceof SqlStatement)) {
      throw new Error('"append" accepts only template string prefixed with SQL (SQL`...`)')
    }

    if (options && options.unsafe === true) {
      const text = statement.strings.reduce((acc, string, i) => {
        acc = `${acc}${string}${statement.values[i] ? statement.values[i] : ''}`
        return acc
      }, '')

      const strings = this.strings.slice(0)
      strings[this.strings.length - 1] += text

      this.strings = strings

      return this
    }

    const last = this.strings[this.strings.length - 1]
    const [first, ...rest] = statement.strings

    this.strings = [
      ...this.strings.slice(0, -1),
      last + first,
      ...rest
    ]

    this.values.push.apply(this.values, statement.values)

    return this
  }
}

function SQL (strings, ...values) {
  return new SqlStatement(strings, values)
}
SQL.glue = SqlStatement.prototype.glue

module.exports = SQL
