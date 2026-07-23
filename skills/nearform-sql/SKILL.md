---
name: nearform-sql
description: "Use this skill when writing, reviewing, or refactoring database queries with @nearform/sql — Nearform's tagged-template library that produces SQL-injection-safe parameterized queries for pg, mysql, and mysql2. Covers installation, the SQL tag (.text/.sql/.values/.debug), helpers (glue, map, unsafe, quoteIdent), Fastify integration, dynamic/bulk queries, and security best practices. Trigger terms: SQL, query, parameterized query, SQL injection, pg, postgres, mysql, @nearform/sql, glue, quoteIdent."
metadata:
  author: "NearForm"
  version: 1.0.0
  tags:
    - category/code-generation
    - tool/postgres
    - tool/mysql
    - domain/engineering
    - domain/security
---

# @nearform/sql

`@nearform/sql` is a tagged-template library that turns ES6 template literals into
**parameterized** queries, immune to SQL injection by construction. It works with
`pg` (PostgreSQL), `mysql`, and `mysql2`. You build a query with the `` SQL`...` ``
tag and pass the resulting statement object straight to your driver.

> **Source:** this skill ships in this repo (under `skills/nearform-sql/`) and is a
> port of the same skill maintained in the
> [`nearform/skills`](https://github.com/nearform/skills) marketplace
> (`plugins/nearform-sql/`). The marketplace version may receive updates first;
> this repo tracks them.

## When to use this skill

Reach for this skill whenever you:

- Write or review code that builds SQL queries in Node.js.
- See a raw SQL string assembled with `+`, `${...}` inside a plain template string, or
  `string.replace` — that is a SQL-injection red flag; rewrite it with the `` SQL`` `` tag.
- Need dynamic queries: conditional `WHERE`, dynamic `SET`, bulk `INSERT`, or `IN (...)` lists.
- Interpolate identifiers (table/column names) into a query.

> For the full API reference see [`references/api-cheatsheet.md`](references/api-cheatsheet.md).
> For framework integration and dynamic-query recipes see [`references/patterns.md`](references/patterns.md).

## Install & import

```sh
npm install @nearform/sql
```

```js
import SQL from '@nearform/sql' // ESM — prefer this for new code
```

```js
const SQL = require('@nearform/sql') // CommonJS — also supported
```

The package itself is published as CommonJS (no `exports` map), but it interops
cleanly with ESM through a **default import** — use `import SQL from '@nearform/sql'`,
then call `SQL.glue`, `SQL.map`, etc. off that default.

Statements are fully typed — the package ships `SQL.d.ts`, and helpers like
`SQL.map<T>(array, mapFunc?)` are generic, so TypeScript infers the element type.

## The golden rule

**Every runtime value goes through `${...}` inside the `` SQL`` `` tag.** The tag captures
each interpolated value as a bound parameter — it never injects it into the query text.

```js
const username = "Robert'); DROP TABLE students;--"

const sql = SQL`SELECT * FROM users WHERE username = ${username}`
// sql.text   -> "SELECT * FROM users WHERE username = $1"   (pg)
// sql.sql    -> "SELECT * FROM users WHERE username = ?"    (mysql)
// sql.values -> ["Robert'); DROP TABLE students;--"]        (bound, harmless)
```

- **Never** build the query with string concatenation or an untagged template literal.
- `SQL.unsafe(value)` and `append(..., { unsafe: true })` interpolate literally and
  **bypass this protection** — use them only for values you fully control, never for
  user input. See the cheatsheet.

## Core usage

The statement object is driver-agnostic. Choose the property your client expects, or
pass the whole object — `pg`, `mysql`, and `mysql2` all read what they need from it.

```js
const user = { username: 'alice', email: 'alice@example.com' }

const sql = SQL`
  INSERT INTO users (username, email)
  VALUES (${user.username}, ${user.email})
`

// PostgreSQL (pg) — uses sql.text ($1, $2) + sql.values
await pgClient.query(sql)

// MySQL (mysql / mysql2) — uses sql.sql (?, ?) + sql.values
mysqlConnection.query(sql)
```

| Property | Use it for | Placeholder style |
|----------|------------|-------------------|
| `sql.text` | PostgreSQL (`pg`) | `$1, $2, …` |
| `sql.sql` | MySQL (`mysql`, `mysql2`) | `?, ?, …` |
| `sql.values` | The bound values array (both) | — |
| `sql.debug` | **Logging/debugging only** — never execute it | inlined (unsafe) |

## Composing queries

Nest `` SQL`` `` tags directly — the preferred way to build queries from fragments.
Parameterization is preserved across the nesting.

```js
const where = SQL`WHERE active = ${true}`
const sql = SQL`SELECT id, email FROM users ${where} ORDER BY created_at DESC`
```

For repeated fragments, use the helpers:

- **`SQL.glue(pieces, separator)`** — join an array of statements (dynamic `SET`/`WHERE`, bulk `VALUES`).
- **`SQL.map(array, mapFunc?)`** — expand an array into bound values (`IN (...)` lists, bulk insert).

```js
const ids = [1, 2, 3]
const sql = SQL`SELECT * FROM users WHERE id IN (${SQL.map(ids)})`
```

See [`references/patterns.md`](references/patterns.md) for complete dynamic-query, Fastify,
and migration recipes.

> `append()` still works but is **deprecated** — prefer nesting tags.

## Best practices checklist

- ✅ Wrap **every** query in the `` SQL`` `` tag; pass interpolated values via `${...}`.
- ✅ Never concatenate strings or use untagged template literals for SQL.
- ⚠️ **No `undefined`** — the tag throws on `undefined`. Coerce nullable fields to `null`:
  ```js
  SQL`INSERT INTO users (name, address) VALUES (${user.name}, ${user.address || null})`
  ```
- ✅ Use **`SQL.quoteIdent(name)`** for dynamic identifiers (table/column names) — never
  interpolate them as values.
- ⚠️ Use **`SQL.unsafe(value)`** only for trusted, non-user values; it bypasses injection protection.
- ✅ Use `sql.debug` for logs only — **never** send it to the driver as the executed query.
- ✅ Enforce the tag in your codebase with [`eslint-plugin-sql`](https://www.npmjs.com/package/eslint-plugin-sql)
  and the `thebearingedge.vscode-sql-lit` VS Code extension for syntax highlighting inside the tag.
