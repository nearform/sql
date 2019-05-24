'use strict'

const test = require('tap').test

const SQL = require('./SQL')

test('SQL helper - build complex query with append', (t) => {
  const name = 'Team 5'
  const description = 'description'
  const teamId = 7
  const organizationId = 'WONKA'

  const sql = SQL`UPDATE teams SET name = ${name}, description = ${description} `
  sql.append(SQL`WHERE id = ${teamId} AND org_id = ${organizationId}`)

  t.equal(sql.text, 'UPDATE teams SET name = $1, description = $2 WHERE id = $3 AND org_id = $4')
  t.equal(sql.sql, 'UPDATE teams SET name = ?, description = ? WHERE id = ? AND org_id = ?')
  t.equal(sql.debug, `UPDATE teams SET name = '${name}', description = '${description}' WHERE id = ${teamId} AND org_id = '${organizationId}'`)
  t.deepEqual(sql.values, [name, description, teamId, organizationId])
  t.end()
})

test('SQL helper - multiline', (t) => {
  const name = 'Team 5'
  const description = 'description'
  const teamId = 7
  const organizationId = 'WONKA'

  const sql = SQL`
    UPDATE teams SET name = ${name}, description = ${description}
    WHERE id = ${teamId} AND org_id = ${organizationId}
  `

  t.equal(sql.text, 'UPDATE teams SET name = $1, description = $2\nWHERE id = $3 AND org_id = $4')
  t.equal(sql.sql, 'UPDATE teams SET name = ?, description = ?\nWHERE id = ? AND org_id = ?')
  t.equal(sql.debug, `UPDATE teams SET name = '${name}', description = '${description}'\nWHERE id = ${teamId} AND org_id = '${organizationId}'`)
  t.deepEqual(sql.values, [name, description, teamId, organizationId])

  t.end()
})

test('SQL helper - multiline with emtpy lines', (t) => {
  const name = 'Team 5'
  const description = 'description'
  const teamId = 7
  const organizationId = 'WONKA'

  const sql = SQL`
    UPDATE teams SET name = ${name}, description = ${description}
    WHERE id = ${teamId} AND org_id = ${organizationId}

    RETURNING id
  `

  t.equal(sql.text, 'UPDATE teams SET name = $1, description = $2\nWHERE id = $3 AND org_id = $4\nRETURNING id')
  t.equal(sql.sql, 'UPDATE teams SET name = ?, description = ?\nWHERE id = ? AND org_id = ?\nRETURNING id')
  t.equal(sql.debug, `UPDATE teams SET name = '${name}', description = '${description}'\nWHERE id = ${teamId} AND org_id = '${organizationId}'\nRETURNING id`)
  t.deepEqual(sql.values, [name, description, teamId, organizationId])
  t.end()
})

test('SQL helper - build complex query with glue', (t) => {
  const name = 'Team 5'
  const description = 'description'
  const teamId = 7
  const organizationId = 'WONKA'

  const sql = SQL` UPDATE teams SET `

  const updates = []
  updates.push(SQL`name = ${name}`)
  updates.push(SQL`description = ${description}`)

  sql.append(sql.glue(updates, ' , '))
  sql.append(SQL`WHERE id = ${teamId} AND org_id = ${organizationId}`)

  t.equal(sql.text, 'UPDATE teams SET name = $1 , description = $2 WHERE id = $3 AND org_id = $4')
  t.equal(sql.sql, 'UPDATE teams SET name = ? , description = ? WHERE id = ? AND org_id = ?')
  t.equal(sql.debug, `UPDATE teams SET name = '${name}' , description = '${description}' WHERE id = ${teamId} AND org_id = '${organizationId}'`)
  t.deepEqual(sql.values, [name, description, teamId, organizationId])
  t.end()
})

test('SQL helper - build complex query with glue - regression #13', (t) => {
  const name = 'Team 5'
  const ids = [1, 2, 3].map(id => SQL`${id}`)

  const sql = SQL`UPDATE teams SET name = ${name} `
  sql.append(SQL`WHERE id IN (`)
  sql.append(sql.glue(ids, ' , '))
  sql.append(SQL`)`)

  t.equal(sql.text, 'UPDATE teams SET name = $1 WHERE id IN ($2 , $3 , $4 )')
  t.equal(sql.sql, 'UPDATE teams SET name = ? WHERE id IN (? , ? , ? )')
  t.equal(sql.debug, `UPDATE teams SET name = '${name}' WHERE id IN (1 , 2 , 3 )`)
  t.deepEqual(sql.values, [name, 1, 2, 3])
  t.end()
})

test('SQL helper - build complex query with glue - regression #17', (t) => {
  const ids = [1, 2, 3].map(id => SQL`(${id})`)

  const sql = SQL`INSERT INTO users (id) VALUES `
  sql.append(sql.glue(ids, ' , '))

  t.equal(sql.text, 'INSERT INTO users (id) VALUES ($1) , ($2) , ($3)')
  t.equal(sql.sql, 'INSERT INTO users (id) VALUES (?) , (?) , (?)')
  t.equal(sql.debug, `INSERT INTO users (id) VALUES (1) , (2) , (3)`)
  t.deepEqual(sql.values, [1, 2, 3])
  t.end()
})

test('SQL helper - build complex query with static glue - regression #17', (t) => {
  const ids = [1, 2, 3].map(id => SQL`(${id})`)

  const sql = SQL`INSERT INTO users (id) VALUES `
  sql.append(SQL.glue(ids, ' , '))

  t.equal(sql.text, 'INSERT INTO users (id) VALUES ($1) , ($2) , ($3)')
  t.equal(sql.sql, 'INSERT INTO users (id) VALUES (?) , (?) , (?)')
  t.equal(sql.debug, `INSERT INTO users (id) VALUES (1) , (2) , (3)`)
  t.deepEqual(sql.values, [1, 2, 3])
  t.end()
})

test('SQL helper - build complex query with append and glue', (t) => {
  const updates = []
  const v1 = 'v1'
  const v2 = 'v2'
  const v3 = 'v3'
  const v4 = 'v4'
  const v5 = 'v5'
  const v6 = 'v6'
  const v7 = 'v7'

  const sql = SQL`TEST QUERY glue pieces FROM `
  updates.push(SQL`v1 = ${v1}`)
  updates.push(SQL`v2 = ${v2}`)
  updates.push(SQL`v3 = ${v3}`)
  updates.push(SQL`v4 = ${v4}`)
  updates.push(SQL`v5 = ${v5}`)

  sql.append(sql.glue(updates, ' , '))
  sql.append(SQL`WHERE v6 = ${v6} `)
  sql.append(SQL`AND v7 = ${v7}`)

  t.equal(sql.text, 'TEST QUERY glue pieces FROM v1 = $1 , v2 = $2 , v3 = $3 , v4 = $4 , v5 = $5 WHERE v6 = $6 AND v7 = $7')
  t.equal(sql.sql, 'TEST QUERY glue pieces FROM v1 = ? , v2 = ? , v3 = ? , v4 = ? , v5 = ? WHERE v6 = ? AND v7 = ?')
  t.equal(sql.debug, `TEST QUERY glue pieces FROM v1 = 'v1' , v2 = 'v2' , v3 = 'v3' , v4 = 'v4' , v5 = 'v5' WHERE v6 = 'v6' AND v7 = 'v7'`)
  t.deepEqual(sql.values, [v1, v2, v3, v4, v5, v6, v7])
  t.end()
})

test('SQL helper - build complex query with append', (t) => {
  const v1 = 'v1'
  const v2 = 'v2'
  const v3 = 'v3'
  const v4 = 'v4'
  const v5 = 'v5'
  const v6 = 'v6'
  const v7 = 'v7'

  const sql = SQL`TEST QUERY glue pieces FROM `
  sql.append(SQL`v1 = ${v1}, `)
  sql.append(SQL`v2 = ${v2}, `)
  sql.append(SQL`v3 = ${v3}, `)
  sql.append(SQL`v4 = ${v4}, `)
  sql.append(SQL`v5 = ${v5} `)
  sql.append(SQL`WHERE v6 = ${v6} `)
  sql.append(SQL`AND v7 = ${v7}`)

  t.equal(sql.text, 'TEST QUERY glue pieces FROM v1 = $1, v2 = $2, v3 = $3, v4 = $4, v5 = $5 WHERE v6 = $6 AND v7 = $7')
  t.equal(sql.sql, 'TEST QUERY glue pieces FROM v1 = ?, v2 = ?, v3 = ?, v4 = ?, v5 = ? WHERE v6 = ? AND v7 = ?')
  t.equal(sql.debug, `TEST QUERY glue pieces FROM v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5' WHERE v6 = 'v6' AND v7 = 'v7'`)
  t.deepEqual(sql.values, [v1, v2, v3, v4, v5, v6, v7])
  t.end()
})

test('SQL helper - build complex query with append passing simple strings and template strings', (t) => {
  const v1 = 'v1'
  const v2 = 'v2'
  const v3 = 'v3'
  const v4 = 'v4'
  const v5 = 'v5'
  const v6 = 'v6'
  const v7 = 'v7'

  const sql = SQL`TEST QUERY glue pieces FROM `
  sql.append(SQL`v1 = ${v1}, `)
  sql.append(SQL`v2 = ${v2}, `)
  sql.append(SQL`v3 = ${v3}, `)
  sql.append(SQL`v4 = ${v4}, `)
  sql.append(SQL`v5 = ${v5}, `)
  sql.append(SQL`v6 = v6 `)
  sql.append(SQL`WHERE v6 = ${v6} `)
  sql.append(SQL`AND v7 = ${v7} `)
  sql.append(SQL`AND v8 = v8`)

  t.equal(sql.text, 'TEST QUERY glue pieces FROM v1 = $1, v2 = $2, v3 = $3, v4 = $4, v5 = $5, v6 = v6 WHERE v6 = $6 AND v7 = $7 AND v8 = v8')
  t.equal(sql.debug, `TEST QUERY glue pieces FROM v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5', v6 = v6 WHERE v6 = 'v6' AND v7 = 'v7' AND v8 = v8`)
  t.deepEqual(sql.values, [v1, v2, v3, v4, v5, v6, v7])
  t.end()
})

test('SQL helper - will throw an error if append is called without using SQL', (t) => {
  const sql = SQL`TEST QUERY glue pieces FROM `
  try {
    sql.append(`v1 = v1`)
    t.fail('showld throw an error when passing strings not prefixed with SQL')
  } catch (e) {
    t.equal(e.message, '"append" accepts only template string prefixed with SQL (SQL`...`)')
  }
  t.end()
})

test('SQL helper - build string using append with and without unsafe flag', (t) => {
  const v2 = 'v2'
  const longName = 'whateverThisIs'
  const sql = SQL`TEST QUERY glue pieces FROM test WHERE test1 == test2`
  sql.append(SQL` AND v1 = v1,`)
  sql.append(SQL` AND v2 = ${v2}, `)
  sql.append(SQL` AND v3 = ${longName}`, { unsafe: true })
  sql.append(SQL` AND v4 = v4`, { unsafe: true })

  t.equal(sql.text, 'TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1, AND v2 = $1,  AND v3 = whateverThisIs AND v4 = v4')
  t.equal(sql.debug, `TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1, AND v2 = 'v2',  AND v3 = whateverThisIs AND v4 = v4`)
  t.equal(sql.values.length, 1)
  t.true(sql.values.includes(v2))
  t.end()
})

test('SQL helper - build string using append and only unsafe', (t) => {
  const v2 = 'v2'
  const longName = 'whateverThisIs'

  const sql = SQL`TEST QUERY glue pieces FROM test WHERE test1 == test2`
  t.equal(sql.text, 'TEST QUERY glue pieces FROM test WHERE test1 == test2')

  sql.append(SQL` AND v1 = v1,`, { unsafe: true })
  t.equal(sql.text, 'TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1,')

  sql.append(SQL` AND v2 = ${v2} AND v3 = ${longName} AND v4 = 'v4'`, { unsafe: true })
  t.equal(sql.text, 'TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1, AND v2 = v2 AND v3 = whateverThisIs AND v4 = \'v4\'')
  t.equal(sql.debug, `TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1, AND v2 = v2 AND v3 = whateverThisIs AND v4 = 'v4'`)

  t.end()
})

test('SQL helper - handles js null values as valid `null` sql values', (t) => {
  const name = null
  const id = 123

  const sql = SQL`UPDATE teams SET name = ${name} WHERE id = ${id}`

  t.equal(sql.text, 'UPDATE teams SET name = $1 WHERE id = $2')
  t.equal(sql.sql, 'UPDATE teams SET name = ? WHERE id = ?')
  t.equal(sql.debug, `UPDATE teams SET name = null WHERE id = ${id}`)
  t.deepEqual(sql.values, [name, id])
  t.end()
})

test('SQL helper - throws when building an sql string with an `undefined` value', (t) => {
  t.throws(() => SQL`UPDATE teams SET name = ${undefined}`)
  t.end()
})
