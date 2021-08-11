# SQL

A simple SQL injection protection module that allows you to use ES6 template strings for escaped statements. Works with [pg](https://www.npmjs.com/package/pg), [mysql](https://www.npmjs.com/package/mysql) and [mysql2](https://www.npmjs.com/package/mysql2) library.

[![npm version][1]][2] [![build status][3]][4] [![js-standard-style][5]][6]

1. [Install](#install)
2. [Usage](#usage)
   1. [Linting](#linting)
3. [Methods](#methods)
   1. [glue](#gluepieces-separator)
   2. (deprecated) [append](#deprecated-appendstatement-options)
4. [Utilities](#utilities)
   1. [unsafe](#unsafevalue)
   2. [quoteIdent](#quoteidentvalue)
5. [How it works?](#how-it-works)
6. [Undefined values and nullable fields](#undefined-values-and-nullable-fields)
7. [Testing, linting, & coverage](#testing-linting--coverage)
8. [Benchmark](#benchmark)
9. [License](#license)

## Install

```sh
npm install @nearform/sql
```

## Usage

```js
const SQL = require('@nearform/sql')

const username = 'user'
const email = 'user@email.com'
const password = 'Password1'

// generate SQL query
const sql = SQL`
  INSERT INTO users (username, email, password)
  VALUES (${username},${email},${password})
`

pg.query(sql) // execute query in pg

mysql.query(sql) // execute query in mysql

mysql2.query(sql) // execute query in mysql2
```

### Linting

We recommend using [eslint-plugin-sql](https://github.com/gajus/eslint-plugin-sql#eslint-plugin-sql-rules-no-unsafe-query) to prevent cases in which the SQL tag is forgotten to be added in front of template strings. Eslint will fail if you write SQL queries without `sql` tag in front of the string.

```sql
`SELECT 1`
// fails - Message: Use "sql" tag

sql`SELECT 1`
// passes
```

## Methods

> ⚠️ **Warning**
>
> The `unsafe` option interprets the interpolated values as literals and it should be used carefully to avoid introducing SQL injection vulnerabilities.

### glue(pieces, separator)

```js
const username = 'user1'
const email = 'user1@email.com'
const userId = 1

const updates = []
updates.push(SQL`name = ${username}`)
updates.push(SQL`email = ${email}`)

const sql = SQL`UPDATE users SET ${SQL.glue(updates, ' , ')} WHERE id = ${userId}`
```

or also

```js
const ids = [1, 2, 3]
const value = 'test'
const sql = SQL`
UPDATE users
SET property = ${value}
WHERE id
IN (${SQL.glue(ids.map(id => SQL`${id}`), ' , ')})
`
```

Glue can also be used statically:

```js
const ids = [1, 2, 3]
const idsSqls = ids.map(id => SQL`(${id})`)
SQL.glue(idsSqls, ' , ')
```

Glue can also be used to generate batch operations:

```js
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
```

### (deprecated) append(statement[, options])

Append has been deprecated in favour of using template literals:

```js
const from = SQL`FROM table`
const sql = SQL`SELECT * ${from}`
```

For now, you can still use append as follows:

```js
const username = 'user1'
const email = 'user1@email.com'
const userId = 1

const sql = SQL`UPDATE users SET name = ${username}, email = ${email}`
sql.append(SQL`, ${dynamicName} = 'dynamicValue'`, { unsafe: true })
sql.append(SQL`WHERE id = ${userId}`)
```

## Utilities

### unsafe(value)

Does a literal interpolation of the provided value, interpreting the provided value as-is.

It works similarly to the `unsafe` option of the `append` method and requires the same security considerations.

```js
const username = 'john'
const userId = 1

const sql = SQL`
  UPDATE users
  SET username = '${SQL.unsafe(username)}'
  WHERE id = ${userId}
`
```

### quoteIdent(value)

Mimics the native PostgreSQL `quote_ident` and MySQL `quote_identifier` functions.

In PostgreSQL, it wraps the provided value in double quotes `"` and escapes any double quotes existing in the provided value.

In MySQL, it wraps the provided value in backticks `` ` `` and escapes any backticks existing in the provided value.

It's convenient to use when schema, table or field names are dynamic and can't be hardcoded in the SQL query string.

```js
const table = 'users'
const username = 'john'
const userId = 1

const sql = SQL`
  UPDATE ${SQL.quoteIdent(table)}
  SET username = ${username}
  WHERE id = ${userId}
`
```

## How it works?

The SQL template string tag parses query and returns an objects that's understandable by [pg](https://www.npmjs.com/package/pg) library:

```js
const username = 'user'
const email = 'user@email.com'
const password = 'Password1'

const sql = SQL`INSERT INTO users (username, email, password) VALUES (${username}, ${email}, ${password})` // generate SQL query
sql.text // INSERT INTO users (username, email, password) VALUES ($1 , $2 , $3) - for pg
sql.sql // INSERT INTO users (username, email, password) VALUES (? , ? , ?) - for mysql and mysql2
sql.values // ['user, 'user@email.com', 'Password1']
```

To help with debugging, you can view an approximate representation of the SQL query with values filled in. It may differ from the actual SQL executed by your database, but serves as a handy reference when debugging. The debug output _should not_ be executed as it is not guaranteed safe. You can may also inspect the `SQL` object via `console.log`.

```js
sql.debug // INSERT INTO users (username, email, password) VALUES ('user','user@email.com','Password1')

console.log(sql) // SQL << INSERT INTO users (username, email, password) VALUES ('user','user@email.com','Password1') >>
```

## Undefined values and nullable fields

Don't pass undefined values into the sql query string builder. It throws on undefined values as this is a javascript concept and sql does not handle it.

Sometimes you may expect to not have a value to be provided to the string builder, and this is ok as the coresponding field is nullable. In this or similar cases the recommended way to handle this is to coerce it to a null js value.

Example:

```js
const user = { name: 'foo bar' }

const sql = SQL`INSERT into users (name, address) VALUES (${user.name},${
  user.address || null
})`
sql.debug // INSERT INTO users (name, address) VALUES ('foo bar',null)
```

## Testing, linting, & coverage

This module can be tested and reported on in a variety of ways...

```sh
npm run test            # runs tap based unit test suite.
npm run test:security   # runs sqlmap security tests.
npm run test:typescript # runs type definition tests.
npm run coverage        # generates a coverage report in docs dir.
npm run lint            # lints via standardJS.
```

## Benchmark

Find more about `@nearform/sql` speed [here](benchmark)

## Editor syntax higlighting
To get syntax higlighting, you can use extension/plugin for these editors:
 - Visual studio code: [thebearingedge.vscode-sql-lit](https://marketplace.visualstudio.com/items?itemName=thebearingedge.vscode-sql-lit) 

# License

Copyright NearForm 2021. Licensed under
[Apache 2.0][7]

[1]: https://img.shields.io/npm/v/@nearform/sql.svg?style=flat-square
[2]: https://npmjs.org/package/@nearform/sql
[3]: https://github.com/nearform/sql/workflows/CI/badge.svg
[4]: https://github.com/nearform/sql/actions?query=workflow%3ACI
[5]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[6]: https://github.com/feross/standard
[7]: https://tldrlegal.com/license/apache-license-2.0-(apache-2.0)
