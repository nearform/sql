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
  t.deepEqual(sql.values, [v1, v2, v3, v4, v5, v6, v7])
  t.end()
})

test('SQL helper - supports raw SQL values', (t) => {
  const v1 = 'v1'
  const v2 = 'v2'
  const v3 = {__raw: 'raw3'}
  const v4 = 'v4'
  const v5 = 'v5'
  const v6 = {__raw: 'raw6'}
  const v7 = 'v7'

  const sql = SQL`TEST QUERY glue pieces FROM `
  sql.append(SQL`v1 = ${v1}, `)
  sql.append(SQL`v2 = ${v2}, `)
  sql.append(SQL`v3 = ${v3}, `)
  sql.append(SQL`v4 = ${v4}, `)
  sql.append(SQL`v5 = ${v5} `)
  sql.append(SQL`WHERE v6 = ${v6} `)
  sql.append(SQL`AND v7 = ${v7}`)

  t.equal(sql.text, 'TEST QUERY glue pieces FROM v1 = $1, v2 = $2, v3 = raw3, v4 = $3, v5 = $4 WHERE v6 = raw6 AND v7 = $5')
  t.deepEqual(sql.values, [v1, v2, v4, v5, v7])
  t.end()
})
