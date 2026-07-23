# @nearform/sql — API cheatsheet

Reference for `@nearform/sql`. Import with `import SQL from '@nearform/sql'`
(ESM) or `const SQL = require('@nearform/sql')` (CommonJS).

## Statement object

Building a query with the `` SQL`` `` tag returns a **statement** with these getters:

| Property | Type | Description |
|----------|------|-------------|
| `.text` | `string` | PostgreSQL form, placeholders `$1, $2, …`. Pass to `pg`. |
| `.sql` | `string` | MySQL form, placeholders `?, ?, …`. Pass to `mysql` / `mysql2`. |
| `.values` | `any[]` | The escaped/bound values, in order. |
| `.debug` | `string` | A formatted but **unsafe** statement with values inlined. For debugging/logging only — never execute it. |

All three major drivers accept the statement object directly:

```js
pgClient.query(sql)            // reads .text + .values
mysqlConnection.query(sql)     // reads .sql + .values
mysql2Connection.query(sql)    // reads .sql + .values
```

## The `SQL` tag

```js
SQL`SELECT * FROM users WHERE id = ${userId} AND active = ${true}`
```

Each `${value}` becomes a bound parameter. This is the only injection-safe way to put
runtime values into a query.

## `SQL.glue(pieces, separator)`

`glue(pieces: StatementLike[], separator: string): SqlStatement`

Joins an array of statements with a separator. Useful for dynamic `SET`, `WHERE`, and bulk `VALUES`.

```js
const updates = []
updates.push(SQL`name = ${username}`)
updates.push(SQL`email = ${email}`)

const sql = SQL`UPDATE users SET ${SQL.glue(updates, ' , ')} WHERE id = ${userId}`
```

Bulk insert:

```js
const users = [
  { id: 1, name: 'something' },
  { id: 2, name: 'something-else' }
]

const sql = SQL`INSERT INTO users (id, name) VALUES
  ${SQL.glue(
    users.map(user => SQL`(${user.id},${user.name})`),
    ' , '
  )}
`
```

## `SQL.map(array, mapFunc?)`

`map<T>(array: T[], mapFunc?: (item: T) => unknown): SqlStatement`

Expands an array into bound values. Ideal for `IN (...)` lists.

```js
const ids = [1, 2, 3]
const values = SQL.map(ids)
const sql = SQL`SELECT * FROM users WHERE id IN (${values})`
```

With a custom mapper:

```js
const objArray = [{ id: 1, name: 'name1' }, { id: 2, name: 'name2' }]
const values = SQL.map(objArray, (item) => item.id)
const sql = SQL`SELECT * FROM users WHERE id IN (${values})`
```

## `SQL.quoteIdent(value)`

`quoteIdent(value: string): SqlStatement`

Safely quotes an **identifier** (table/column/schema name). Mimics PostgreSQL's
`quote_ident` and MySQL's `quote_identifier`:

- PostgreSQL: wraps in double quotes `"…"` with escaping.
- MySQL: wraps in backticks `` `…` `` with escaping.

Use it whenever an identifier is dynamic — you cannot bind an identifier as a value.

```js
const table = 'users'

const sql = SQL`
  UPDATE ${SQL.quoteIdent(table)}
  SET username = ${username}
  WHERE id = ${userId}
`
```

## `SQL.unsafe(value)` ⚠️

`unsafe<T>(value: T): SqlStatement`

Interpolates the value **literally**, as-is, into the query text — bypassing
parameterization. Returns a thin wrapper that the `` SQL`` `` tag recognizes and
inlines verbatim.

> ⚠️ **Security:** `unsafe` interprets interpolated values as literals. It can introduce
> SQL-injection vulnerabilities. Use it **only** for values you fully control (constants,
> enums you validated), **never** for user input.

```js
const username = 'john'
const userId = 1

const sql = SQL`
  UPDATE users
  SET username = '${SQL.unsafe(username)}'
  WHERE id = ${userId}
`
```

## `append(statement, options?)` — DEPRECATED

`append(statement: StatementLike, options?: { unsafe?: boolean }): SqlStatement`

Appends to an existing statement. **Deprecated** — prefer nesting `` SQL`` `` tags instead:

```js
// Preferred
const from = SQL`FROM users`
const sql = SQL`SELECT * ${from}`

// Legacy (deprecated)
const sql = SQL`UPDATE users SET name = ${username}, email = ${email}`
sql.append(SQL`, login = ${dynamicName}`, { unsafe: true })
sql.append(SQL`WHERE id = ${userId}`)
```

## Gotcha: no `undefined`

The tag **throws on `undefined`** — `undefined` is a JavaScript concept, not a SQL one.
Coerce nullable fields to `null`:

```js
const user = { name: 'foo bar' } // no `address`

const sql = SQL`
  INSERT INTO users (name, address)
  VALUES (${user.name}, ${user.address || null})
`
```
