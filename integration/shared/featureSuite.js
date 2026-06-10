'use strict'

const assert = require('node:assert')
const SQL = require('../../SQL')

// Runs the full @nearform/sql feature matrix against a live database.
// Every case builds a query with the public API and EXECUTES it, then asserts
// on the rows read back — proving the generated SQL is both valid and safe.
//
//   test  - the node:test `test` function from the calling file
//   getDb - returns the connected adapter (see helpers/db.js). It's a getter
//           because the connection is opened in the file's `before` hook,
//           after this function has registered its subtests.
module.exports = function runFeatureSuite (test, getDb) {
  const reset = db => db.raw('DELETE FROM users')

  test('basic parameterized insert/select round-trips', async () => {
    const db = getDb()
    await reset(db)
    await db.query(SQL`
      INSERT INTO users (id, username, email, password)
      VALUES (${1}, ${'alice'}, ${'alice@example.com'}, ${'secret'})
    `)
    const rows = await db.query(SQL`
      SELECT id, username, email, password FROM users WHERE id = ${1}
    `)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].username, 'alice')
    assert.equal(rows[0].email, 'alice@example.com')
    assert.equal(rows[0].password, 'secret')
  })

  test('interpolated values are stored as literals, not executed (injection)', async () => {
    const db = getDb()
    await reset(db)
    const evil = "Robert'); DROP TABLE users;--"
    await db.query(SQL`INSERT INTO users (id, username) VALUES (${2}, ${evil})`)
    const rows = await db.query(SQL`SELECT username FROM users WHERE id = ${2}`)
    assert.equal(rows[0].username, evil)
    // The table must still exist and hold exactly the row we inserted.
    const all = await db.query(SQL`SELECT id FROM users`)
    assert.equal(all.length, 1)
  })

  test('glue builds a working IN clause', async () => {
    const db = getDb()
    await reset(db)
    for (const id of [1, 2, 3, 4]) {
      await db.query(SQL`INSERT INTO users (id, username) VALUES (${id}, ${'u' + id})`)
    }
    const ids = [1, 3]
    const rows = await db.query(SQL`
      SELECT id FROM users
      WHERE id IN (${SQL.glue(ids.map(id => SQL`${id}`), ' , ')})
      ORDER BY id
    `)
    assert.deepEqual(rows.map(r => Number(r.id)), [1, 3])
  })

  test('glue builds a working batch insert', async () => {
    const db = getDb()
    await reset(db)
    const users = [
      { id: 10, name: 'u10' },
      { id: 11, name: 'u11' },
      { id: 12, name: 'u12' }
    ]
    await db.query(SQL`
      INSERT INTO users (id, username)
      VALUES ${SQL.glue(users.map(u => SQL`(${u.id}, ${u.name})`), ' , ')}
    `)
    const rows = await db.query(SQL`SELECT id, username FROM users ORDER BY id`)
    assert.equal(rows.length, 3)
    assert.deepEqual(rows.map(r => r.username), ['u10', 'u11', 'u12'])
  })

  test('map builds a working IN clause (default and object mapper)', async () => {
    const db = getDb()
    await reset(db)
    for (const id of [21, 22, 23, 24]) {
      await db.query(SQL`INSERT INTO users (id, username) VALUES (${id}, ${'u' + id})`)
    }
    // default mapper over an array of scalars
    const rows = await db.query(SQL`
      SELECT id FROM users WHERE id IN (${SQL.map([21, 23])}) ORDER BY id
    `)
    assert.deepEqual(rows.map(r => Number(r.id)), [21, 23])

    // explicit mapper over an array of objects
    const objs = [{ id: 22 }, { id: 24 }]
    const rows2 = await db.query(SQL`
      SELECT id FROM users WHERE id IN (${SQL.map(objs, o => o.id)}) ORDER BY id
    `)
    assert.deepEqual(rows2.map(r => Number(r.id)), [22, 24])
  })

  test('quoteIdent produces valid quoted identifiers (incl. escaping)', async () => {
    const db = getDb()
    // dynamic column + table name on the existing table
    await reset(db)
    await db.query(SQL`INSERT INTO ${SQL.quoteIdent('users')} (id, username) VALUES (${80}, ${'quoted'})`)
    const rows = await db.query(SQL`
      SELECT ${SQL.quoteIdent('username')} FROM ${SQL.quoteIdent('users')} WHERE id = ${80}
    `)
    assert.equal(rows[0].username, 'quoted')

    // an identifier that is INVALID unquoted (contains a space) and one that
    // contains the dialect's own quote char — exercises the escaping path.
    const weird = db.dialect === 'pg' ? 'we"ird table' : 'we`ird table'
    await db.raw(`DROP TABLE IF EXISTS ${quoteRaw(db.dialect, weird)}`)
    await db.query(SQL`CREATE TABLE ${SQL.quoteIdent(weird)} (id INTEGER PRIMARY KEY)`)
    try {
      await db.query(SQL`INSERT INTO ${SQL.quoteIdent(weird)} (id) VALUES (${99})`)
      const wrows = await db.query(SQL`SELECT id FROM ${SQL.quoteIdent(weird)} WHERE id = ${99}`)
      assert.equal(Number(wrows[0].id), 99)
    } finally {
      await db.raw(`DROP TABLE IF EXISTS ${quoteRaw(db.dialect, weird)}`)
    }
  })

  test('unsafe interpolates a trusted fragment literally', async () => {
    const db = getDb()
    await reset(db)
    const columns = ['id', 'username'] // trusted, not user input
    await db.query(SQL`
      INSERT INTO users (${SQL.unsafe(columns.join(', '))})
      VALUES (${30}, ${'unsafe-user'})
    `)
    const rows = await db.query(SQL`SELECT username FROM users WHERE id = ${30}`)
    assert.equal(rows[0].username, 'unsafe-user')
  })

  test('nested SqlStatement keeps placeholder numbering correct', async () => {
    const db = getDb()
    await reset(db)
    await db.query(SQL`
      INSERT INTO users (id, username, email)
      VALUES (${40}, ${'bob'}, ${'bob@example.com'})
    `)
    // For pg this generates `... id = $1 AND (username = $2 AND email = $3)`;
    // executing it proves the $N offset logic is correct against a real server.
    const condition = SQL`username = ${'bob'} AND email = ${'bob@example.com'}`
    const rows = await db.query(SQL`
      SELECT id FROM users WHERE id = ${40} AND (${condition})
    `)
    assert.equal(rows.length, 1)
    assert.equal(Number(rows[0].id), 40)
  })

  test('deprecated append builds an executable query', async () => {
    const db = getDb()
    await reset(db)
    await db.query(SQL`INSERT INTO users (id, username) VALUES (${50}, ${'appended'})`)
    const sql = SQL`SELECT id, username FROM users WHERE username = ${'appended'}`
    sql.append(SQL` AND id = ${50}`)
    const rows = await db.query(sql)
    assert.equal(rows.length, 1)
    assert.equal(Number(rows[0].id), 50)
  })

  test('null values round-trip', async () => {
    const db = getDb()
    await reset(db)
    await db.query(SQL`
      INSERT INTO users (id, username, metadata) VALUES (${60}, ${'nulluser'}, ${null})
    `)
    const rows = await db.query(SQL`SELECT metadata FROM users WHERE id = ${60}`)
    assert.equal(rows[0].metadata, null)
  })

  test('special characters and unicode round-trip intact', async () => {
    const db = getDb()
    await reset(db)
    const weirdVal = 'o\'brien "the\\great" 😀 ®'
    await db.query(SQL`INSERT INTO users (id, username) VALUES (${70}, ${weirdVal})`)
    const rows = await db.query(SQL`SELECT username FROM users WHERE id = ${70}`)
    assert.equal(rows[0].username, weirdVal)
  })
}

// Quote an identifier for raw (non-SqlStatement) DDL — same rule as
// quoteIdentifier.js, used only for setup/teardown of the "weird" table.
function quoteRaw (dialect, value) {
  const q = dialect === 'mysql' ? '`' : '"'
  return q + value.replace(new RegExp(q, 'g'), q + q) + q
}
