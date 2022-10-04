'use strict'

const util = require('util')
const test = require('tap').test

const SQL = require('./SQL')
const unsafe = SQL.unsafe
const quoteIdent = SQL.quoteIdent

test('SQL helper - build complex query with append', async t => {
  const name = 'Team 5'
  const description = 'description'
  const teamId = 7
  const organizationId = 'WONKA'

  const sql = SQL`UPDATE teams SET name = ${name}, description = ${description} `
  sql.append(SQL`WHERE id = ${teamId} AND org_id = ${organizationId}`)

  t.equal(
    sql.text,
    'UPDATE teams SET name = $1, description = $2 WHERE id = $3 AND org_id = $4'
  )
  t.equal(
    sql.sql,
    'UPDATE teams SET name = ?, description = ? WHERE id = ? AND org_id = ?'
  )
  t.equal(
    sql.debug,
    `UPDATE teams SET name = '${name}', description = '${description}' WHERE id = ${teamId} AND org_id = '${organizationId}'`
  )
  t.same(sql.values, [name, description, teamId, organizationId])
})

test('SQL helper - multiline', async t => {
  const name = 'Team 5'
  const description = 'description'
  const teamId = 7
  const organizationId = 'WONKA'

  const sql = SQL`
    UPDATE teams SET name = ${name}, description = ${description}
    WHERE id = ${teamId} AND org_id = ${organizationId}
  `

  t.equal(
    sql.text,
    'UPDATE teams SET name = $1, description = $2\nWHERE id = $3 AND org_id = $4'
  )
  t.equal(
    sql.sql,
    'UPDATE teams SET name = ?, description = ?\nWHERE id = ? AND org_id = ?'
  )
  t.equal(
    sql.debug,
    `UPDATE teams SET name = '${name}', description = '${description}'\nWHERE id = ${teamId} AND org_id = '${organizationId}'`
  )
  t.same(sql.values, [name, description, teamId, organizationId])
})

test('SQL helper - multiline with emtpy lines', async t => {
  const name = 'Team 5'
  const description = 'description'
  const teamId = 7
  const organizationId = 'WONKA'

  const sql = SQL`
    UPDATE teams SET name = ${name}, description = ${description}
    WHERE id = ${teamId} AND org_id = ${organizationId}

    RETURNING id
  `

  t.equal(
    sql.text,
    'UPDATE teams SET name = $1, description = $2\nWHERE id = $3 AND org_id = $4\nRETURNING id'
  )
  t.equal(
    sql.sql,
    'UPDATE teams SET name = ?, description = ?\nWHERE id = ? AND org_id = ?\nRETURNING id'
  )
  t.equal(
    sql.debug,
    `UPDATE teams SET name = '${name}', description = '${description}'\nWHERE id = ${teamId} AND org_id = '${organizationId}'\nRETURNING id`
  )
  t.same(sql.values, [name, description, teamId, organizationId])
})

test('SQL helper - build complex query with map', async t => {
  const objArray = [{
    id: 1,
    name: 'name1'
  },
  {
    id: 2,
    name: 'name2'
  },
  {
    id: 3,
    name: 'name3'
  }]

  const mapFunction = (objItem) => {
    return objItem.id
  }

  const values = SQL.map(objArray, mapFunction)
  t.equal(values !== null, true)
  const sql = SQL`INSERT INTO users (id) VALUES (${values})`

  t.equal(sql.text, 'INSERT INTO users (id) VALUES ($1,$2,$3)')
  t.equal(sql.sql, 'INSERT INTO users (id) VALUES (?,?,?)')
  t.equal(sql.debug, 'INSERT INTO users (id) VALUES (1,2,3)')
  t.same(sql.values, [1, 2, 3])
})

test('SQL helper - build complex query with map - empty array', async t => {
  const objArray = []

  const mapFunction = (objItem) => {
    return objItem.id
  }

  const values = SQL.map(objArray, mapFunction)

  t.equal(values, null)
})

test('SQL helper - build complex query with map - bad mapper function', async t => {
  const objArray = []

  const mapFunction = null

  const values = SQL.map(objArray, mapFunction)

  t.equal(values, null)
})

test('SQL helper - build complex query with glue', async t => {
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

  t.equal(
    sql.text,
    'UPDATE teams SET name = $1 , description = $2 WHERE id = $3 AND org_id = $4'
  )
  t.equal(
    sql.sql,
    'UPDATE teams SET name = ? , description = ? WHERE id = ? AND org_id = ?'
  )
  t.equal(
    sql.debug,
    `UPDATE teams SET name = '${name}' , description = '${description}' WHERE id = ${teamId} AND org_id = '${organizationId}'`
  )
  t.same(sql.values, [name, description, teamId, organizationId])
})

test('SQL helper - build complex query with glue - regression #13', async t => {
  const name = 'Team 5'
  const ids = [1, 2, 3].map(id => SQL`${id}`)

  const sql = SQL`UPDATE teams SET name = ${name} `
  sql.append(SQL`WHERE id IN (`)
  sql.append(sql.glue(ids, ' , '))
  sql.append(SQL`)`)

  t.equal(sql.text, 'UPDATE teams SET name = $1 WHERE id IN ($2 , $3 , $4 )')
  t.equal(sql.sql, 'UPDATE teams SET name = ? WHERE id IN (? , ? , ? )')
  t.equal(
    sql.debug,
    `UPDATE teams SET name = '${name}' WHERE id IN (1 , 2 , 3 )`
  )
  t.same(sql.values, [name, 1, 2, 3])
})

test('SQL helper - build complex query with glue - regression #17', async t => {
  const ids = [1, 2, 3].map(id => SQL`(${id})`)

  const sql = SQL`INSERT INTO users (id) VALUES `
  sql.append(sql.glue(ids, ' , '))

  t.equal(sql.text, 'INSERT INTO users (id) VALUES ($1) , ($2) , ($3)')
  t.equal(sql.sql, 'INSERT INTO users (id) VALUES (?) , (?) , (?)')
  t.equal(sql.debug, 'INSERT INTO users (id) VALUES (1) , (2) , (3)')
  t.same(sql.values, [1, 2, 3])
})

test('SQL helper - build complex query with static glue - regression #17', async t => {
  const ids = [1, 2, 3].map(id => SQL`(${id})`)

  const sql = SQL`INSERT INTO users (id) VALUES `
  sql.append(SQL.glue(ids, ' , '))

  t.equal(sql.text, 'INSERT INTO users (id) VALUES ($1) , ($2) , ($3)')
  t.equal(sql.sql, 'INSERT INTO users (id) VALUES (?) , (?) , (?)')
  t.equal(sql.debug, 'INSERT INTO users (id) VALUES (1) , (2) , (3)')
  t.same(sql.values, [1, 2, 3])
})

test('glue works with quoteIdent - regression #77', async t => {
  const sql = SQL.glue([SQL`SELECT * FROM ${quoteIdent('tbl')}`])

  t.equal(sql.text, 'SELECT * FROM "tbl"')
  t.equal(sql.sql, 'SELECT * FROM `tbl`')
  t.equal(sql.debug, 'SELECT * FROM "tbl"')
  t.same(sql.values, [])
})

test('SQL helper - build complex query with append and glue', async t => {
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

  t.equal(
    sql.text,
    'TEST QUERY glue pieces FROM v1 = $1 , v2 = $2 , v3 = $3 , v4 = $4 , v5 = $5 WHERE v6 = $6 AND v7 = $7'
  )
  t.equal(
    sql.sql,
    'TEST QUERY glue pieces FROM v1 = ? , v2 = ? , v3 = ? , v4 = ? , v5 = ? WHERE v6 = ? AND v7 = ?'
  )
  t.equal(
    sql.debug,
    "TEST QUERY glue pieces FROM v1 = 'v1' , v2 = 'v2' , v3 = 'v3' , v4 = 'v4' , v5 = 'v5' WHERE v6 = 'v6' AND v7 = 'v7'"
  )
  t.same(sql.values, [v1, v2, v3, v4, v5, v6, v7])
})

test('SQL helper - build complex query with append', async t => {
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

  t.equal(
    sql.text,
    'TEST QUERY glue pieces FROM v1 = $1, v2 = $2, v3 = $3, v4 = $4, v5 = $5 WHERE v6 = $6 AND v7 = $7'
  )
  t.equal(
    sql.sql,
    'TEST QUERY glue pieces FROM v1 = ?, v2 = ?, v3 = ?, v4 = ?, v5 = ? WHERE v6 = ? AND v7 = ?'
  )
  t.equal(
    sql.debug,
    "TEST QUERY glue pieces FROM v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5' WHERE v6 = 'v6' AND v7 = 'v7'"
  )
  t.same(sql.values, [v1, v2, v3, v4, v5, v6, v7])
})

test('SQL helper - build complex query with append passing simple strings and template strings', async t => {
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

  t.equal(
    sql.text,
    'TEST QUERY glue pieces FROM v1 = $1, v2 = $2, v3 = $3, v4 = $4, v5 = $5, v6 = v6 WHERE v6 = $6 AND v7 = $7 AND v8 = v8'
  )
  t.equal(
    sql.debug,
    "TEST QUERY glue pieces FROM v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5', v6 = v6 WHERE v6 = 'v6' AND v7 = 'v7' AND v8 = v8"
  )
  t.same(sql.values, [v1, v2, v3, v4, v5, v6, v7])
})

test('SQL helper - will throw an error if append is called without using SQL', async t => {
  const sql = SQL`TEST QUERY glue pieces FROM `
  try {
    sql.append('v1 = v1')
    t.fail('showld throw an error when passing strings not prefixed with SQL')
  } catch (e) {
    t.equal(
      e.message,
      '"append" accepts only template string prefixed with SQL (SQL`...`)'
    )
  }
})

test('SQL helper - build string using append with and without unsafe flag', async t => {
  const v2 = 'v2'
  const longName = 'whateverThisIs'
  const sql = SQL`TEST QUERY glue pieces FROM test WHERE test1 == test2`
  sql.append(SQL` AND v1 = v1,`)
  sql.append(SQL` AND v2 = ${v2}, `)
  sql.append(SQL` AND v3 = ${longName}`, { unsafe: true })
  sql.append(SQL` AND v4 = v4`, { unsafe: true })

  t.equal(
    sql.text,
    'TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1, AND v2 = $1,  AND v3 = whateverThisIs AND v4 = v4'
  )
  t.equal(
    sql.debug,
    "TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1, AND v2 = 'v2',  AND v3 = whateverThisIs AND v4 = v4"
  )
  t.equal(sql.values.length, 1)
  t.ok(sql.values.includes(v2))
})

test('SQL helper - build string using append and only unsafe', async t => {
  const v2 = 'v2'
  const longName = 'whateverThisIs'

  const sql = SQL`TEST QUERY glue pieces FROM test WHERE test1 == test2`
  t.equal(sql.text, 'TEST QUERY glue pieces FROM test WHERE test1 == test2')

  sql.append(SQL` AND v1 = v1,`, { unsafe: true })
  t.equal(
    sql.text,
    'TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1,'
  )

  sql.append(SQL` AND v2 = ${v2} AND v3 = ${longName} AND v4 = 'v4'`, {
    unsafe: true
  })
  t.equal(
    sql.text,
    "TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1, AND v2 = v2 AND v3 = whateverThisIs AND v4 = 'v4'"
  )
  t.equal(
    sql.debug,
    "TEST QUERY glue pieces FROM test WHERE test1 == test2 AND v1 = v1, AND v2 = v2 AND v3 = whateverThisIs AND v4 = 'v4'"
  )
})

test('SQL helper - handles js null values as valid `null` sql values', async t => {
  const name = null
  const id = 123

  const sql = SQL`UPDATE teams SET name = ${name} WHERE id = ${id}`

  t.equal(sql.text, 'UPDATE teams SET name = $1 WHERE id = $2')
  t.equal(sql.sql, 'UPDATE teams SET name = ? WHERE id = ?')
  t.equal(sql.debug, `UPDATE teams SET name = null WHERE id = ${id}`)
  t.same(sql.values, [name, id])
})

test('SQL helper - throws when building an sql string with an `undefined` value', async t => {
  t.throws(() => SQL`UPDATE teams SET name = ${undefined}`)
})

test('empty append', async t => {
  const sql = SQL`UPDATE teams SET name = ${'team'}`.append()

  t.equal(sql.text, 'UPDATE teams SET name = $1')
  t.equal(sql.sql, 'UPDATE teams SET name = ?')
  t.equal(sql.debug, "UPDATE teams SET name = 'team'")
  t.same(sql.values, ['team'])
})

test('inspect', async t => {
  const sql = SQL`UPDATE teams SET name = ${'team'}`
  t.equal(util.inspect(sql), "SQL << UPDATE teams SET name = 'team' >>")
})

test('quoteIdent', async t => {
  t.test('simple', async t => {
    const table = 'teams'
    const name = 'name'
    const id = 123

    const sql = SQL`UPDATE ${quoteIdent(
      table
    )} SET name = ${name} WHERE id = ${id}`

    t.equal(sql.text, 'UPDATE "teams" SET name = $1 WHERE id = $2')
    t.equal(sql.sql, 'UPDATE `teams` SET name = ? WHERE id = ?')
    t.equal(sql.debug, `UPDATE "teams" SET name = 'name' WHERE id = ${id}`)
    t.same(sql.values, [name, id])
  })
})

test('unsafe', async t => {
  const name = 'name'
  const id = 123

  const sql = SQL`UPDATE teams SET name = '${unsafe(name)}' WHERE id = ${id}`

  t.equal(sql.text, "UPDATE teams SET name = 'name' WHERE id = $1")
  t.equal(sql.sql, "UPDATE teams SET name = 'name' WHERE id = ?")
  t.equal(sql.debug, `UPDATE teams SET name = 'name' WHERE id = ${id}`)
  t.same(sql.values, [id])
})

test('should be able to append query that is using "{ unsafe: true }"', async t => {
  const table = 'teams'
  const id = 123

  const reusableSql = SQL`SELECT id FROM`
  reusableSql.append(SQL` ${table}`, { unsafe: true })
  reusableSql.append(SQL` WHERE id = ${id}`)

  const sql = SQL`SELECT * FROM`
  sql.append(SQL` ${table} `, { unsafe: true })
  sql.append(SQL`INNER JOIN (`)
  sql.append(reusableSql)
  sql.append(SQL`) as t2 ON t2.id = id`)

  t.equal(
    sql.text,
    'SELECT * FROM teams INNER JOIN (SELECT id FROM teams WHERE id = $1) as t2 ON t2.id = id'
  )
  t.equal(
    sql.sql,
    'SELECT * FROM teams INNER JOIN (SELECT id FROM teams WHERE id = ?) as t2 ON t2.id = id'
  )
  t.equal(
    sql.debug,
    `SELECT * FROM teams INNER JOIN (SELECT id FROM teams WHERE id = ${id}) as t2 ON t2.id = id`
  )
  t.same(sql.values, [id])
})

test('should be able to append query that is using "quoteIdent(...)"', async t => {
  const table = 'teams'
  const id = 123

  const reusableSql = SQL`SELECT id FROM ${quoteIdent(table)} WHERE id = ${id}`

  const sql = SQL`SELECT * FROM ${quoteIdent(table)} INNER JOIN (`
  sql.append(reusableSql)
  sql.append(SQL`) as t2 ON t2.id = id`)

  t.equal(
    sql.text,
    'SELECT * FROM "teams" INNER JOIN (SELECT id FROM "teams" WHERE id = $1) as t2 ON t2.id = id'
  )
  t.equal(
    sql.sql,
    'SELECT * FROM `teams` INNER JOIN (SELECT id FROM `teams` WHERE id = ?) as t2 ON t2.id = id'
  )
  t.equal(
    sql.debug,
    `SELECT * FROM "teams" INNER JOIN (SELECT id FROM "teams" WHERE id = ${id}) as t2 ON t2.id = id`
  )
  t.same(sql.values, [id])
})

test('should be able to append a SqlStatement within a template literal', t => {
  const a = SQL`FROM table`
  const selectWithLiteralExpression = SQL`SELECT * ${a}`

  t.equal(selectWithLiteralExpression.text, 'SELECT * FROM table')
  t.equal(selectWithLiteralExpression.sql, 'SELECT * FROM table')
  t.equal(selectWithLiteralExpression.debug, 'SELECT * FROM table')
  t.end()
})

test('should be able to use SQL.glue within template literal', t => {
  const pre = 'A'
  const ids = [1, '2', 'three']
  const idValues = ids.map(id => SQL`${id}`)
  const names = ['Bee', 'Cee', 'Dee']
  const nameValues = names.map(name => SQL`${name}`)
  const post = 'B'
  const sql = SQL`UPDATE my_table SET active = FALSE WHERE pre=${pre} AND id IN (${SQL.glue(
    idValues,
    ','
  )}) AND name IN (${SQL.glue(nameValues, ',')}) AND post=${post}`
  t.equal(
    sql.text,
    'UPDATE my_table SET active = FALSE WHERE pre=$1 AND id IN ($2,$3,$4) AND name IN ($5,$6,$7) AND post=$8'
  )
  t.equal(
    sql.sql,
    'UPDATE my_table SET active = FALSE WHERE pre=? AND id IN (?,?,?) AND name IN (?,?,?) AND post=?'
  )
  t.equal(
    sql.debug,
    "UPDATE my_table SET active = FALSE WHERE pre='A' AND id IN (1,'2','three') AND name IN ('Bee','Cee','Dee') AND post='B'"
  )
  t.same(sql.values, ['A', 1, '2', 'three', 'Bee', 'Cee', 'Dee', 'B'])
  t.end()
})

test('should be able to use nested SQLStatements in template literal', t => {
  const a = 'A'
  const b = 'B'
  const c = 'C'
  const d = 'D'
  const sql = SQL`UPDATE my_table SET active = FALSE WHERE a=${a} AND ${SQL`b=${b} AND ${SQL`c=${c}`}`} AND d=${d}`
  t.equal(
    sql.text,
    'UPDATE my_table SET active = FALSE WHERE a=$1 AND b=$2 AND c=$3 AND d=$4'
  )
  t.equal(
    sql.sql,
    'UPDATE my_table SET active = FALSE WHERE a=? AND b=? AND c=? AND d=?'
  )
  t.equal(
    sql.debug,
    "UPDATE my_table SET active = FALSE WHERE a='A' AND b='B' AND c='C' AND d='D'"
  )
  t.same(sql.values, ['A', 'B', 'C', 'D'])
  t.end()
})

test('should be able to use the result of SQL.glue([SQL``, SQL``], separator) result with multiple values inside the first element of SQL.glue', t => {
  const ids = [1, 2, 3]
  const name = 'foo'
  const inIds = SQL.glue(
    ids.map((id) => SQL`${id}`),
    ' , '
  )
  const condition = SQL`tsd.id IN (${inIds})`

  const filters = [
    condition,
    SQL`tsd.name = ${name}`
  ]

  const sql = SQL`SELECT tsd.* FROM data tsd WHERE ${SQL.glue(filters, ' AND ')}`
  t.equal(
    sql.text,
    'SELECT tsd.* FROM data tsd WHERE tsd.id IN ($1 , $2 , $3) AND tsd.name = $4'
  )
  t.same(
    sql.values, [1, 2, 3, 'foo']
  )
  t.equal(
    sql.debug,
    "SELECT tsd.* FROM data tsd WHERE tsd.id IN (1 , 2 , 3) AND tsd.name = 'foo'"
  )
  t.end()
})

test('examples in the readme work as expected', t => {
  {
    const username = 'user1'
    const email = 'user1@email.com'
    const userId = 1

    const updates = []
    updates.push(SQL`name = ${username}`)
    updates.push(SQL`email = ${email}`)

    const sql = SQL`UPDATE users SET ${SQL.glue(
      updates,
      ' , '
    )} WHERE id = ${userId}`
    t.equal(sql.text, 'UPDATE users SET name = $1 , email = $2 WHERE id = $3')
  }
  {
    const ids = [1, 2, 3]
    const value = 'test'
    const sql = SQL`
      UPDATE users
      SET property = ${value}
      WHERE id
      IN (${SQL.glue(
        ids.map(id => SQL`${id}`),
        ' , '
      )})
    `
    t.equal(
      sql.text,
      `UPDATE users
SET property = $1
WHERE id
IN ($2 , $3 , $4)`
    )
  }

  {
    const users = [
      { id: 1, name: 'something' },
      { id: 2, name: 'something-else' },
      { id: 3, name: 'something-other' }
    ]

    const sql = SQL`INSERT INTO users (id, name) VALUES 
      ${SQL.glue(
        users.map(user => SQL`(${user.id},${user.name}})`),
        ' , '
      )}
    `
    t.equal(
      sql.text,
      `INSERT INTO users (id, name) VALUES
($1,$2}) , ($3,$4}) , ($5,$6})`
    )
  }
  t.end()
})
