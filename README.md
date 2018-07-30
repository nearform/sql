# SQL
A simple SQL injection protection module that allows you to use ES6 template strings for escaped statements. Works with [pg](https://www.npmjs.com/package/pg) library.

[![npm version][1]][2] [![build status][3]][4] [![js-standard-style][5]][6]



1. [Install](#install)
2. [Usage](#usage)
    1. [Linting](#linting)
3. [Methods](#methods)
    1. [append](#appendstatement)
    2. [glue](#gluepieces-separator)
4. [How it works?](#how-it-works)
5. [Testing, linting, & coverage](#testing-linting--coverage)
6. [Benchmark](#benchmark)
7. [License](#license)

## Install

```sh
npm install @nearform/sql
```

## Usage

```js
const SQL = require('@nearform/sql')

const db = connectDB() // your db instance

const username = 'user'
const email = 'user@email.com'
const password = 'Password1'

// generate SQL query
const sql = SQL`
  INSERT INTO users (username, email, password)
  VALUES (${username},${email},${password})
`

db.query(sql) // execute query
```

### Linting
We recommend using [eslint-plugin-sql](https://github.com/gajus/eslint-plugin-sql#eslint-plugin-sql-rules-no-unsafe-query) to prevent cases in which the SQL tag is forgotten to be added in front of template strings. Eslint will fail if you write SQL queries without `sql` tag in front of the string.

```js
`SELECT 1`
// fails - Message: Use "sql" tag

sql`SELECT 1`
// passes
```

## Methods
### append(statement[, options])
```js
const username = 'user1'
const email = 'user1@email.com'
const userId = 1

const sql = SQL`UPDATE users SET name = ${username}, email = ${email} `
sql.append(SQL`SET ${dynamicName} = '2'`, { unsafe: true })
sql.append(SQL`WHERE id = ${userId}`)
```

### glue(pieces, separator)
```js
const username = 'user1'
const email = 'user1@email.com'
const userId = 1

const sql = SQL` UPDATE users SET `

const updates = []
updates.push(SQL`name = ${username}`)
updates.push(SQL`email = ${email}`)

sql.append(sql.glue(updates, ' , '))
sql.append(SQL`WHERE id = ${userId}`)
```

## How it works?
The SQL template string tag parses query and returns an objects that's understandable by [pg](https://www.npmjs.com/package/pg) library:
```js
const username = 'user'
const email = 'user@email.com'
const password = 'Password1'

const sql = SQL`INSERT INTO users (username, email, password) VALUES (${username},${email},${password})` // generate SQL query
sql.text // INSERT INTO users (username, email, password) VALUES ($1 , $2 , $3)
sql.values // ['user, 'user@email.com', 'Password1']
```

## Testing, linting, & coverage
This module can be tested and reported on in a variety of ways...
```sh
npm run test            # runs tap based unit test suite.
npm run test:security   # runs sqlmap security tests.
npm run coverage        # generates a coverage report in docs dir.
npm run lint            # lints via standardJS.
```

## Benchmark
Find more about `@nearform/sql` speed [here](benchmark)

# License
Copyright nearForm 2018. Licensed under
[Apache 2.0](<https://tldrlegal.com/license/apache-license-2.0-(apache-2.0)>)

[1]: https://img.shields.io/npm/v/@nearform/sql.svg?style=flat-square
[2]: https://npmjs.org/package/@nearform/sql
[3]: https://circleci.com/gh/nearform/sql/tree/master.svg?style=shield&circle-token=ec5a946d225c797d503fc5a748137db7b82ab47f
[4]: https://circleci.com/gh/nearform/sql
[5]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[6]: https://github.com/feross/standard
