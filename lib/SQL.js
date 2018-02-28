class SqlStatement {
  constructor (strings, values) {
    this.strings = strings
    this.values = values
  }

  glue (pieces, separator) {
    const result = pieces
      .map((piece) => {
        piece.strings = piece.strings.filter(s => !!s.trim())

        return piece
      })
      .reduce((res, current) => {
        res.strings = res.strings.concat(current.strings)
        res.values = res.values.concat(current.values)

        return res
      }, { strings: [], values: [] })

    result.strings = result.strings.map((value, index) => {
      if (index === 0 || value.trim() === '') {
        return value
      }

      return separator + value
    }).concat([' '])

    return new SqlStatement(
      result.strings,
      result.values
    )
  }

  get text () {
    return this.strings.reduce((prev, curr, i) => {
      return prev + '$' + i + curr
    }).replace(/^\s+/, '')
  }

  append (statement) {
    /* TODO: fix "Cannot assign to read only property '0' of object '[object Array]'"
     *
     * this.strings[this.strings.length - 1] += statement.strings[0]
     * this.strings.push.apply(this.strings, statement.strings.slice(1));
     */

    const last = this.strings[this.strings.length - 1]
    const [first, ...rest] = statement.strings

    this.strings = this.strings.slice(0, -1).concat(last + first, rest)
    this.values.push.apply(this.values, statement.values)

    return this
  }
}

function SQL (strings, ...values) {
  return new SqlStatement(strings, values)
}

module.exports = SQL
