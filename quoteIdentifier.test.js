'use strict'

const { describe, test } = require('node:test')
const quoteIdentifier = require('./quoteIdentifier')

describe('quoteIdentifier', () => {
  describe('pg', () => {
    test('simple', async t => {
      t.assert.deepStrictEqual(quoteIdentifier('identifier', 'pg'), '"identifier"')
    })

    test('with quotes', async t => {
      t.assert.deepStrictEqual(quoteIdentifier('"quotes"', 'pg'), '"""quotes"""')
    })
  })

  describe('mysql', () => {
    test('simple', t => {
      t.assert.deepStrictEqual(quoteIdentifier('identifier', 'mysql'), '`identifier`')
    })

    test('with quotes', t => {
      t.assert.deepStrictEqual(quoteIdentifier('`quotes`', 'mysql'), '```quotes```')
    })
  })

  describe('without type', () => {
    test('simple', t => {
      t.assert.deepStrictEqual(quoteIdentifier('identifier'), '"identifier"')
    })

    test('with quotes', t => {
      t.assert.deepStrictEqual(quoteIdentifier('"quotes"'), '"""quotes"""')
    })
  })
})
