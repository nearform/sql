const test = require('tap').test

const { MYSQL } = require('./SQL')

test('SQL helper - build complex query with append', (t) => {
  const name = 'Team 5'
  const description = 'description'
  const teamId = 7
  const organizationId = 'WONKA'

  const sql = MYSQL`UPDATE teams SET name = ${name}, description = ${description} `
  sql.append(MYSQL`WHERE id = ${teamId} AND org_id = ${organizationId}`)

  t.equal(sql.text, 'UPDATE teams SET name = ?, description = ? WHERE id = ? AND org_id = ?')
  t.deepEqual(sql.values, [name, description, teamId, organizationId])
  t.end()
})

test('SQL helper - multiline', (t) => {
  const name = 'Team 5'
  const description = 'description'
  const teamId = 7
  const organizationId = 'WONKA'

  const sql = MYSQL`
    UPDATE teams SET name = ${name}, description = ${description}
    WHERE id = ${teamId} AND org_id = ${organizationId}
  `

  t.equal(sql.text, 'UPDATE teams SET name = ?, description = ?\nWHERE id = ? AND org_id = ?')
  t.deepEqual(sql.values, [name, description, teamId, organizationId])
  t.end()
})

test('SQL helper - build complex query with glue', (t) => {
  const name = 'Team 5'
  const description = 'description'
  const teamId = 7
  const organizationId = 'WONKA'

  const sql = MYSQL` UPDATE teams SET `

  const updates = []
  updates.push(MYSQL`name = ${name}`)
  updates.push(MYSQL`description = ${description}`)

  sql.append(sql.glue(updates, ' , '))
  sql.append(MYSQL`WHERE id = ${teamId} AND org_id = ${organizationId}`)

  t.equal(sql.text, 'UPDATE teams SET name = ? , description = ? WHERE id = ? AND org_id = ?')
  t.deepEqual(sql.values, [name, description, teamId, organizationId])
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

  const sql = MYSQL`TEST QUERY glue pieces FROM `
  updates.push(MYSQL`v1 = ${v1}`)
  updates.push(MYSQL`v2 = ${v2}`)
  updates.push(MYSQL`v3 = ${v3}`)
  updates.push(MYSQL`v4 = ${v4}`)
  updates.push(MYSQL`v5 = ${v5}`)

  sql.append(sql.glue(updates, ' , '))
  sql.append(MYSQL`WHERE v6 = ${v6} `)
  sql.append(MYSQL`AND v7 = ${v7}`)

  t.equal(sql.text, 'TEST QUERY glue pieces FROM v1 = ? , v2 = ? , v3 = ? , v4 = ? , v5 = ? WHERE v6 = ? AND v7 = ?')
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

  const sql = MYSQL`TEST QUERY glue pieces FROM `
  sql.append(MYSQL`v1 = ${v1}, `)
  sql.append(MYSQL`v2 = ${v2}, `)
  sql.append(MYSQL`v3 = ${v3}, `)
  sql.append(MYSQL`v4 = ${v4}, `)
  sql.append(MYSQL`v5 = ${v5} `)
  sql.append(MYSQL`WHERE v6 = ${v6} `)
  sql.append(MYSQL`AND v7 = ${v7}`)

  t.equal(sql.text, 'TEST QUERY glue pieces FROM v1 = ?, v2 = ?, v3 = ?, v4 = ?, v5 = ? WHERE v6 = ? AND v7 = ?')
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

  const sql = MYSQL`TEST QUERY glue pieces FROM `
  sql.append(MYSQL`v1 = ${v1}, `)
  sql.append(MYSQL`v2 = ${v2}, `)
  sql.append(MYSQL`v3 = ${v3}, `)
  sql.append(MYSQL`v4 = ${v4}, `)
  sql.append(MYSQL`v5 = ${v5}, `)
  sql.append(MYSQL`v6 = v6 `)
  sql.append(MYSQL`WHERE v6 = ${v6} `)
  sql.append(MYSQL`AND v7 = ${v7} `)
  sql.append(MYSQL`AND v8 = v8`)

  t.equal(sql.text, 'TEST QUERY glue pieces FROM v1 = ?, v2 = ?, v3 = ?, v4 = ?, v5 = ?, v6 = v6 WHERE v6 = ? AND v7 = ? AND v8 = v8')
  t.deepEqual(sql.values, [v1, v2, v3, v4, v5, v6, v7])
  t.end()
})

test('SQL helper - will throw an error if append is called without using SQL', (t) => {
  const sql = MYSQL`TEST QUERY glue pieces FROM `
  try {
    sql.append(`v1 = v1`)
    t.fail('should throw an error when passing strings not prefixed with MYSQL')
  } catch (e) {
    t.equal(e.message, '"append" accepts only template string prefixed with PG/MYSQL/ORACLE (PG`...`)')
  }
  t.end()
})

test('SQL helper - build string using append with and without unsafe flag', (t) => {
  const v2 = 'v2'
  const longName = 'whateverThisIs'
  const sql = MYSQL`TEST QUERY glue pieces FROM test WHERE test1 == test2`
  sql.append(MYSQL` AND v1 = v1,`)
  sql.append(MYSQL` AND v2 = ${v2}, `)
  sql.append(MYSQL` AND v3 = ${longName}`, { unsafe: true })
  sql.append(MYSQL` AND v4 = v4`, { unsafe: true })

  t.equal(sql.text, 'TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1, AND v2 = ?,  AND v3 = whateverThisIs AND v4 = v4')
  t.equal(sql.values.length, 1)
  t.true(sql.values.includes(v2))
  t.end()
})

test('SQL helper - build string using append and only unsafe', (t) => {
  const v2 = 'v2'
  const longName = 'whateverThisIs'

  const sql = MYSQL`TEST QUERY glue pieces FROM test WHERE test1 == test2`
  t.equal(sql.text, 'TEST QUERY glue pieces FROM test WHERE test1 == test2')

  sql.append(MYSQL` AND v1 = v1,`, { unsafe: true })
  t.equal(sql.text, 'TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1,')

  sql.append(MYSQL` AND v2 = ${v2} AND v3 = ${longName} AND v4 = 'v4'`, { unsafe: true })
  t.equal(sql.text, 'TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1, AND v2 = v2 AND v3 = whateverThisIs AND v4 = \'v4\'')

  t.end()
})
