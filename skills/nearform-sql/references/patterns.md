# @nearform/sql — patterns & integrations

Recipes for using `@nearform/sql` in real applications. Examples use ESM
(`import SQL from '@nearform/sql'`); the equivalent CommonJS is `const SQL = require('@nearform/sql')`.

## Fastify integration

Register a `pg` pool as a decorator, then build queries with the tag inside your
route handlers or — better — a repository layer. Repositories own DB access; route
handlers stay thin and just call repository methods.

```js
import fp from 'fastify-plugin'
import pg from 'pg'
import SQL from '@nearform/sql'

const { Pool } = pg

// plugins/pg.js — register the pool once
export default fp(async function (fastify) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  fastify.decorate('pg', pool)
  fastify.addHook('onClose', async () => { await pool.end() })
}, { name: 'pg' })
```

```js
// repositories/users.js — DB access lives here
export default function makeUsersRepository ({ pg }) {
  return {
    async findById (id) {
      const sql = SQL`SELECT id, email FROM users WHERE id = ${id}`
      const { rows } = await pg.query(sql) // pg reads sql.text + sql.values
      return rows[0]
    },

    async create ({ username, email }) {
      const sql = SQL`
        INSERT INTO users (username, email)
        VALUES (${username}, ${email})
        RETURNING id
      `
      const { rows } = await pg.query(sql)
      return rows[0].id
    }
  }
}
```

Wire the repository onto the instance (after the `pg` plugin is registered), then keep the
route handler thin:

```js
// plugins/users-repository.js — depends on the `pg` decorator above
import fp from 'fastify-plugin'
import makeUsersRepository from '../repositories/users.js'

export default fp(async function (fastify) {
  fastify.decorate('usersRepository', makeUsersRepository({ pg: fastify.pg }))
}, { dependencies: ['pg'] })
```

```js
// routes/users.js — handler stays thin, schema validates input
fastify.get('/users/:id', {
  schema: { params: { type: 'object', properties: { id: { type: 'integer' } } } }
}, async (req) => {
  return fastify.usersRepository.findById(req.params.id)
})
```

For MySQL (`mysql2/promise`) the only change is the driver call — the query building is
identical, the driver reads `sql.sql` + `sql.values`:

```js
const [rows] = await connection.query(SQL`SELECT id FROM users WHERE email = ${email}`)
```

## Dynamic queries

### Conditional WHERE

Collect the conditions that apply, then `glue` them with `' AND '`. Skip the clause entirely
when there are no filters.

```js
function searchUsers (pg, { name, minAge, active }) {
  const filters = []
  // LIKE works on both pg and mysql; use ILIKE for case-insensitive matching on Postgres only.
  if (name !== undefined)   filters.push(SQL`name LIKE ${'%' + name + '%'}`)
  if (minAge !== undefined) filters.push(SQL`age >= ${minAge}`)
  if (active !== undefined) filters.push(SQL`active = ${active}`)

  const where = filters.length
    ? SQL`WHERE ${SQL.glue(filters, ' AND ')}`
    : SQL``

  return pg.query(SQL`SELECT id, name FROM users ${where} ORDER BY name`)
}
```

### Dynamic UPDATE / SET

```js
function buildUpdate (pg, id, patch) {
  const sets = Object.entries(patch).map(
    // `value ?? null` — the tag throws on `undefined`; coerce nullable fields to null.
    ([col, value]) => SQL`${SQL.quoteIdent(col)} = ${value ?? null}`
  )
  return pg.query(SQL`UPDATE users SET ${SQL.glue(sets, ' , ')} WHERE id = ${id}`)
}
```

> Note `SQL.quoteIdent(col)` for the column name (an identifier) and `${value ?? null}` (a
> bound value). Never bind an identifier as a value, and never interpolate a value as an identifier.

### Bulk INSERT

```js
const rows = [
  { id: 1, name: 'a' },
  { id: 2, name: 'b' }
]

const sql = SQL`INSERT INTO users (id, name) VALUES
  ${SQL.glue(rows.map(r => SQL`(${r.id}, ${r.name})`), ' , ')}
`
```

### IN (...) lists

```js
const ids = [1, 2, 3]
const sql = SQL`SELECT * FROM users WHERE id IN (${SQL.map(ids)})`
```

## Migrations & dynamic identifiers

When a query references a dynamic schema, table, or column name, that name is an
**identifier**, not a value — bind it with `SQL.quoteIdent`:

```js
function truncate (pg, table) {
  return pg.query(SQL`TRUNCATE TABLE ${SQL.quoteIdent(table)}`)
}
```

`SQL.unsafe` interpolates raw text and is acceptable **only** for values you fully control —
e.g. a fixed constant or a value you have validated against an allow-list. It is never
acceptable for anything derived from user input:

```js
// OK — direction is validated against an allow-list, not user-controlled
const ORDER = { asc: 'ASC', desc: 'DESC' }
const direction = ORDER[input] ?? 'ASC'
const sql = SQL`SELECT * FROM users ORDER BY created_at ${SQL.unsafe(direction)}`
```

## Anti-patterns to flag in review

| ❌ Anti-pattern | ✅ Fix |
|----------------|--------|
| String concatenation: `'... WHERE id = ' + id` | `` SQL`... WHERE id = ${id}` `` |
| Untagged template: `` `... WHERE id = ${id}` `` | Add the `SQL` tag |
| `pg.query(sql.debug)` | `pg.query(sql)` — `.debug` is unsafe, logging only |
| `SQL.unsafe(userInput)` | Bind it: `${userInput}` (or `quoteIdent` if it's an identifier) |
| Identifier as a bound value: `` SQL`SELECT * FROM ${table}` `` | `` SQL`SELECT * FROM ${SQL.quoteIdent(table)}` `` |
| Passing `undefined`: `${user.address}` when it may be undefined | `${user.address || null}` |
