const test = require('tap').test

const { ORACLE } = require('./SQL')

test('SQL helper - build complex query with append', (t) => {
  const name = 'Team 5'
  const description = 'description'
  const teamId = 7
  const organizationId = 'WONKA'

  const sql = ORACLE`UPDATE teams SET name = ${name}, description = ${description} `
  sql.append(ORACLE`WHERE id = ${teamId} AND org_id = ${organizationId}`)

  t.equal(sql.text, 'UPDATE teams SET name = :1, description = :2 WHERE id = :3 AND org_id = :4')
  t.deepEqual(sql.values, [name, description, teamId, organizationId])
  t.end()
})

test('SQL helper - multiline', (t) => {
  const name = 'Team 5'
  const description = 'description'
  const teamId = 7
  const organizationId = 'WONKA'

  const sql = ORACLE`
    UPDATE teams SET name = ${name}, description = ${description}
    WHERE id = ${teamId} AND org_id = ${organizationId}
  `

  t.equal(sql.text, 'UPDATE teams SET name = :1, description = :2\nWHERE id = :3 AND org_id = :4')
  t.deepEqual(sql.values, [name, description, teamId, organizationId])
  t.end()
})

test('SQL helper - build complex query with glue', (t) => {
  const name = 'Team 5'
  const description = 'description'
  const teamId = 7
  const organizationId = 'WONKA'

  const sql = ORACLE` UPDATE teams SET `

  const updates = []
  updates.push(ORACLE`name = ${name}`)
  updates.push(ORACLE`description = ${description}`)

  sql.append(sql.glue(updates, ' , '))
  sql.append(ORACLE`WHERE id = ${teamId} AND org_id = ${organizationId}`)

  t.equal(sql.text, 'UPDATE teams SET name = :1 , description = :2 WHERE id = :3 AND org_id = :4')
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

  const sql = ORACLE`TEST QUERY glue pieces FROM `
  updates.push(ORACLE`v1 = ${v1}`)
  updates.push(ORACLE`v2 = ${v2}`)
  updates.push(ORACLE`v3 = ${v3}`)
  updates.push(ORACLE`v4 = ${v4}`)
  updates.push(ORACLE`v5 = ${v5}`)

  sql.append(sql.glue(updates, ' , '))
  sql.append(ORACLE`WHERE v6 = ${v6} `)
  sql.append(ORACLE`AND v7 = ${v7}`)

  t.equal(sql.text, 'TEST QUERY glue pieces FROM v1 = :1 , v2 = :2 , v3 = :3 , v4 = :4 , v5 = :5 WHERE v6 = :6 AND v7 = :7')
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

  const sql = ORACLE`TEST QUERY glue pieces FROM `
  sql.append(ORACLE`v1 = ${v1}, `)
  sql.append(ORACLE`v2 = ${v2}, `)
  sql.append(ORACLE`v3 = ${v3}, `)
  sql.append(ORACLE`v4 = ${v4}, `)
  sql.append(ORACLE`v5 = ${v5} `)
  sql.append(ORACLE`WHERE v6 = ${v6} `)
  sql.append(ORACLE`AND v7 = ${v7}`)

  t.equal(sql.text, 'TEST QUERY glue pieces FROM v1 = :1, v2 = :2, v3 = :3, v4 = :4, v5 = :5 WHERE v6 = :6 AND v7 = :7')
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

  const sql = ORACLE`TEST QUERY glue pieces FROM `
  sql.append(ORACLE`v1 = ${v1}, `)
  sql.append(ORACLE`v2 = ${v2}, `)
  sql.append(ORACLE`v3 = ${v3}, `)
  sql.append(ORACLE`v4 = ${v4}, `)
  sql.append(ORACLE`v5 = ${v5}, `)
  sql.append(ORACLE`v6 = v6 `)
  sql.append(ORACLE`WHERE v6 = ${v6} `)
  sql.append(ORACLE`AND v7 = ${v7} `)
  sql.append(ORACLE`AND v8 = v8`)

  t.equal(sql.text, 'TEST QUERY glue pieces FROM v1 = :1, v2 = :2, v3 = :3, v4 = :4, v5 = :5, v6 = v6 WHERE v6 = :6 AND v7 = :7 AND v8 = v8')
  t.deepEqual(sql.values, [v1, v2, v3, v4, v5, v6, v7])
  t.end()
})

test('SQL helper - will throw an error if append is called without using SQL', (t) => {
  const sql = ORACLE`TEST QUERY glue pieces FROM `
  try {
    sql.append(`v1 = v1`)
    t.fail('should throw an error when passing strings not prefixed with ORACLE')
  } catch (e) {
    t.equal(e.message, '"append" accepts only template string prefixed with PG/MYSQL/ORACLE (PG`...`)')
  }
  t.end()
})

test('SQL helper - build string using append with and without unsafe flag', (t) => {
  const v2 = 'v2'
  const longName = 'whateverThisIs'
  const sql = ORACLE`TEST QUERY glue pieces FROM test WHERE test1 == test2`
  sql.append(ORACLE` AND v1 = v1,`)
  sql.append(ORACLE` AND v2 = ${v2}, `)
  sql.append(ORACLE` AND v3 = ${longName}`, { unsafe: true })
  sql.append(ORACLE` AND v4 = v4`, { unsafe: true })

  t.equal(sql.text, 'TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1, AND v2 = :1,  AND v3 = whateverThisIs AND v4 = v4')
  t.equal(sql.values.length, 1)
  t.true(sql.values.includes(v2))
  t.end()
})

test('SQL helper - build string using append and only unsafe', (t) => {
  const v2 = 'v2'
  const longName = 'whateverThisIs'

  const sql = ORACLE`TEST QUERY glue pieces FROM test WHERE test1 == test2`
  t.equal(sql.text, 'TEST QUERY glue pieces FROM test WHERE test1 == test2')

  sql.append(ORACLE` AND v1 = v1,`, { unsafe: true })
  t.equal(sql.text, 'TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1,')

  sql.append(ORACLE` AND v2 = ${v2} AND v3 = ${longName} AND v4 = 'v4'`, { unsafe: true })
  t.equal(sql.text, 'TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1, AND v2 = v2 AND v3 = whateverThisIs AND v4 = \'v4\'')

  t.end()
})
