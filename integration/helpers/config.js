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

// MySQL connection config used by the `mysql2` driver. Targets a modern MySQL
// (8.x/9.x) — mysql2 speaks the default caching_sha2_password auth.
const mysql = {
  host: process.env.MYSQLHOST || 'localhost',
  port: Number(process.env.MYSQLPORT) || 3306,
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASS || 'mysql',
  database: process.env.MYSQLDB || 'sqlmap',
  // utf8mb4 so 4-byte characters (e.g. emoji) round-trip.
  charset: 'utf8mb4',
  // A fresh caching_sha2_password account over a non-TLS connection needs the
  // server's public key to complete auth; allow retrieving it. Fine for local/
  // CI test infra (no untrusted network).
  allowPublicKeyRetrieval: true
}

// Separate config for the legacy `mysql` driver. It only supports
// mysql_native_password, which is removed/disabled in MySQL 8.4+/9, so it must
// point at a MySQL 8.0 server (own port locally; its own CI job). Its own
// env namespace lets it differ from the mysql2 target when both run together.
const mysqlLegacy = {
  host: process.env.MYSQLLEGACYHOST || 'localhost',
  port: Number(process.env.MYSQLLEGACYPORT) || 3307,
  user: process.env.MYSQLLEGACYUSER || 'root',
  password: process.env.MYSQLLEGACYPASS || 'mysql',
  database: process.env.MYSQLLEGACYDB || 'sqlmap',
  charset: 'utf8mb4',
  // Used by the mysql2 connection that flips the account to native_password
  // (see ensureNativePassword); the legacy `mysql` driver ignores it.
  allowPublicKeyRetrieval: true
}

module.exports = { pg, mysql, mysqlLegacy }
