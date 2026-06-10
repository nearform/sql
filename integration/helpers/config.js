'use strict'

// PostgreSQL connection config.
// Mirrors the env-var convention already used by sqlmap/config.js so the same
// CI environment variables drive both suites.
const pg = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDB || 'sqlmap',
  password: process.env.PGPASS || 'postgres',
  port: Number(process.env.PGPORT) || 5432
}

// MySQL connection config, shared by both the `mysql` and `mysql2` drivers.
const mysql = {
  host: process.env.MYSQLHOST || 'localhost',
  port: Number(process.env.MYSQLPORT) || 3306,
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASS || 'mysql',
  database: process.env.MYSQLDB || 'sqlmap',
  // utf8mb4 so 4-byte characters (e.g. emoji) round-trip on both the
  // `mysql` driver (defaults to 3-byte utf8) and `mysql2`.
  charset: 'utf8mb4'
}

module.exports = { pg, mysql }
