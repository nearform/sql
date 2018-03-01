# SQL
[![build status][1]][2] [![js-standard-style][3]][4]

SQL injection protection module

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

const sql = SQL`INSERT INTO users (username, email, password) VALUES (${username},${email},${password})` // generate SQL query

db.query(sql) // execute query
```

## Methods
### append(statement)
```js
const username = 'user1'
const email = 'user1@email.com'
const userId = 1

const sql = SQL`UPDATE users SET name = ${username}, email = ${email} `
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

## Testing, linting, & coverage
This module can be tested and reported on in a variety of ways...
```sh
npm run test        # runs tap based unit test suite.
npm run coverage    # generates a coverage report in docs dir.
npm run lint        # lints via standardJS.
```

# License
Copyright nearForm 2018. Licensed under 
[Apache 2.0](<https://tldrlegal.com/license/apache-license-2.0-(apache-2.0)>)

[1]: https://circleci.com/gh/nearform/sql/tree/master.svg?style=shield&circle-token=ec5a946d225c797d503fc5a748137db7b82ab47f
[2]: https://circleci.com/gh/nearform/sql
[3]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[4]: https://github.com/feross/standard