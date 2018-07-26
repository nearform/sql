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

    let strings = []
    for (let i = 0; i < result.strings.length; i++) {
      let value = result.strings[i]

      if (i === 0 || value.trim() === '') {
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

  get text () {
    let text = this.strings[0]

    for (let i = 1; i < this.strings.length; i++) {
      text += '$' + i + this.strings[i]
    }

    return text.replace(/^\s+|\s+$/mg, '')
  }

  append (statement) {
    if (!statement) {
      return this
    }

    if (!(statement instanceof SqlStatement)) {
      this.strings[this.strings.length - 1] += statement

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
