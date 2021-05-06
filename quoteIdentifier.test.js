'use strict'

const test = require('tap').test
const quoteIdentifier = require('./quoteIdentifier')

test('quoteIdentifier', async t => {
  t.test('pg', async t => {
    t.test('simple', async t => {
      t.same(quoteIdentifier('identifier', 'pg'), '"identifier"')
    })

    t.test('with quotes', async t => {
      t.same(quoteIdentifier('"quotes"', 'pg'), '"""quotes"""')
    })
  })

  t.test('mysql', async t => {
    t.test('simple', async t => {
      t.same(quoteIdentifier('identifier', 'mysql'), '`identifier`')
    })

    t.test('with quotes', async t => {
      t.same(quoteIdentifier('`quotes`', 'mysql'), '```quotes```')
    })
  })

  t.test('without type', async t => {
    t.test('simple', async t => {
      t.same(quoteIdentifier('identifier'), '"identifier"')
    })

    t.test('with quotes', async t => {
      t.same(quoteIdentifier('"quotes"'), '"""quotes"""')
    })
  })
})
