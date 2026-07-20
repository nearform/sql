'use strict'

const config = require('./config')

// Each adapter exposes the same shape so the shared feature suite is
// driver-agnostic:
//   - dialect: 'pg' | 'mysql'        (drives dialect-specific SQL in the suite)
//   - query(stmt): runs a SqlStatement, returns the result rows
//   - raw(text):   runs a plain SQL string (used for DDL / cleanup)
//   - end():       closes the connection

// PostgreSQL via `pg`. A SqlStatement is passed straight to client.query()
// because it exposes `.text` and `.values` getters — the documented usage.
async function withPg () {
  const { Client } = require('pg')
  const client = new Client(config.pg)
  await client.connect()
  return {
    dialect: 'pg',
    async query (stmt) {
      const res = await client.query(stmt)
      return res.rows
    },
    async raw (text) {
      const res = await client.query(text)
      return res.rows
    },
    async end () {
      await client.end()
    }
  }
}

// MySQL via `mysql2/promise`. The driver reads `sql` and `values` off the
// options object, which map directly onto a SqlStatement's `.sql`/`.values`.
async function withMysql2 () {
  const mysql = require('mysql2/promise')
  const conn = await mysql.createConnection(config.mysql)
  return {
    dialect: 'mysql',
    async query (stmt) {
      const [rows] = await conn.query({ sql: stmt.sql, values: stmt.values })
      return rows
    },
    async raw (text) {
      const [rows] = await conn.query(text)
      return rows
    },
    async end () {
      await conn.end()
    }
  }
}

// The legacy `mysql` driver cannot speak MySQL's default `caching_sha2_password`
// auth — it only supports `mysql_native_password`. mysql2 can connect, so we use
// it to switch the account to native_password first. This requires a MySQL 8.0
// server (config.mysqlLegacy): native_password is removed/disabled in 8.4+/9, so
// the plugin wouldn't even be loaded there.
async function ensureNativePassword () {
  const mysql = require('mysql2/promise')
  const conn = await mysql.createConnection(config.mysqlLegacy)
  try {
    // We connect over TCP, so the account is `<user>@'%'`. `?` placeholders are
    // escaped client-side (text protocol) into a valid `'user'@'%'` account.
    await conn.query(
      "ALTER USER ?@'%' IDENTIFIED WITH mysql_native_password BY ?",
      [config.mysqlLegacy.user, config.mysqlLegacy.password]
    )
  } finally {
    await conn.end()
  }
}

// MySQL via the original callback-based `mysql` driver, promisified.
async function withMysql () {
  await ensureNativePassword()
  const mysql = require('mysql')
  const conn = mysql.createConnection(config.mysqlLegacy)
  await new Promise((resolve, reject) =>
    conn.connect(err => (err ? reject(err) : resolve()))
  )
  const run = (sql, values) =>
    new Promise((resolve, reject) =>
      conn.query(sql, values, (err, rows) => (err ? reject(err) : resolve(rows)))
    )
  return {
    dialect: 'mysql',
    async query (stmt) {
      return run(stmt.sql, stmt.values)
    },
    async raw (text) {
      return run(text)
    },
    async end () {
      await new Promise(resolve => conn.end(() => resolve()))
    }
  }
}

// Fresh, portable `users` table. Explicit (non-auto) integer ids keep the
// inserts identical across dialects.
async function createUsersTable (db) {
  await db.raw('DROP TABLE IF EXISTS users')
  await db.raw(`CREATE TABLE users (
    id        INTEGER PRIMARY KEY,
    username  VARCHAR(255) NOT NULL,
    email     VARCHAR(255),
    password  VARCHAR(255),
    metadata  VARCHAR(255)
  )`)
}

module.exports = { withPg, withMysql, withMysql2, createUsersTable }
