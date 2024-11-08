'use strict'

const { describe, test } = require('node:test')
const assert = require('node:assert')
const quoteIdentifier = require('./quoteIdentifier')

describe('quoteIdentifier', () => {
  describe('pg', () => {
    test('simple', async t => {
      assert.deepStrictEqual(quoteIdentifier('identifier', 'pg'), '"identifier"')
    })

    test('with quotes', async t => {
      assert.deepStrictEqual(quoteIdentifier('"quotes"', 'pg'), '"""quotes"""')
    })
  })

  describe('mysql', () => {
    test('simple', t => {
      assert.deepStrictEqual(quoteIdentifier('identifier', 'mysql'), '`identifier`')
    })

    test('with quotes', t => {
      assert.deepStrictEqual(quoteIdentifier('`quotes`', 'mysql'), '```quotes```')
    })
  })

  describe('without type', () => {
    test('simple', t => {
      assert.deepStrictEqual(quoteIdentifier('identifier'), '"identifier"')
    })

    test('with quotes', t => {
      assert.deepStrictEqual(quoteIdentifier('"quotes"'), '"""quotes"""')
    })
  })
})
