function isRawValue (value) {
  return typeof value === 'object' && typeof value.__raw === 'string'
}

class SqlStatement {
  constructor (strings, values) {
    this.strings = strings
    this._values = values
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
    let parameter = 0

    for (let i = 1; i < this.strings.length; i++) {
      const value = this._values[i - 1]

      if (isRawValue(value)) {
        text += value.__raw + this.strings[i]
      } else {
        parameter++
        text += '$' + parameter + this.strings[i]
      }
    }

    return text.replace(/^\s+|\s+$/mg, '')
  }

  get values () {
    return this._values.filter(v => !isRawValue(v))
  }

  get rawValues () {
    return this._values.filter(isRawValue)
  }

  append (statement) {
    const last = this.strings[this.strings.length - 1]
    const [first, ...rest] = statement.strings

    this.strings = [
      ...this.strings.slice(0, -1),
      last + first,
      ...rest
    ]

    this._values.push.apply(this._values, statement._values)

    return this
  }
}

function SQL (strings, ...values) {
  return new SqlStatement(strings, values)
}

module.exports = SQL
