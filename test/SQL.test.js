const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const SQL = require('../lib/SQL')

lab.experiment('SQL', () => {
  lab.test('SQL helper - build complex query with append', (done) => {
    const name = 'Team 5'
    const description = 'description'
    const teamId = 7
    const organizationId = 'WONKA'

    const sql = SQL`UPDATE teams SET name = ${name}, description = ${description} `
    sql.append(SQL`WHERE id = ${teamId} AND org_id = ${organizationId}`)

    expect(sql.text).to.equal('UPDATE teams SET name = $1, description = $2 WHERE id = $3 AND org_id = $4')
    expect(sql.values).to.equal([name, description, teamId, organizationId])
    done()
  })

  lab.test('SQL helper - build complex query with glue', (done) => {
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

    expect(sql.text).to.equal('UPDATE teams SET name = $1 , description = $2 WHERE id = $3 AND org_id = $4')
    expect(sql.values).to.equal([name, description, teamId, organizationId])
    done()
  })

  lab.test('SQL helper - build complex query with append and glue', (done) => {
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

    expect(sql.text).to.equal('TEST QUERY glue pieces FROM v1 = $1 , v2 = $2 , v3 = $3 , v4 = $4 , v5 = $5 WHERE v6 = $6 AND v7 = $7')
    expect(sql.values).to.equal([v1, v2, v3, v4, v5, v6, v7])
    done()
  })

  lab.test('SQL helper - build complex query with append', (done) => {
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

    expect(sql.text).to.equal('TEST QUERY glue pieces FROM v1 = $1, v2 = $2, v3 = $3, v4 = $4, v5 = $5 WHERE v6 = $6 AND v7 = $7')
    expect(sql.values).to.equal([v1, v2, v3, v4, v5, v6, v7])
    done()
  })
})
