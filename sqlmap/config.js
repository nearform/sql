module.exports = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDB || 'sqlmap',
  password: process.env.PGPASS || '',
  port: process.env.PGPORT || 5432
}
