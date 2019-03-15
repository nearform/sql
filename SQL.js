class SqlStatement {
  constructor (strings, values) {
    this.strings = strings
    this.values = values
  }

  glue (pieces, separator) {
    const result = { strings: [], values: [] }

    for (let i = 0; i < pieces.length; i++) {
      let strings = pieces[i].strings.filter(s => !!s.trim())

      result.strings = result.strings.concat(strings)
      result.values = result.values.concat(pieces[i].values)
    }

    if (result.strings.length === 0 && result.values.length > 0) {
      result.strings = (new Array(result.values.length)).fill('')
    }

    let strings = []
    for (let i = 0; i < result.strings.length; i++) {
      let value = result.strings[i]

      if (i === 0) {
        strings.push(value)
        continue
      }

      strings.push(separator + value)
    }

    result.strings = strings.concat([' '])

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

    return text.replace(/^\s+|\s+$/mg, '')
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

module.exports = SQL
