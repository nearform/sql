'use strict'

function quoteIdentifier (value, type) {
  const quote = type === 'mysql' ? '`' : '"'

  const quoted = value.replace(new RegExp(quote, 'g'), `${quote}${quote}`)

  return `${quote}${quoted}${quote}`
}

module.exports = quoteIdentifier
