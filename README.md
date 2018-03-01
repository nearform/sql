# SQL
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
Copyright nearForm 2018. Licensed under [MIT][License]

[License]: ./LICENSE.md 