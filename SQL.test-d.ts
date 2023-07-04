import SQL from '.'
import { glue, map, SqlStatement } from '.'
import { expectType, expectError } from 'tsd'

expectType<SqlStatement>(SQL`SELECT 1`)
expectType<SQL.SqlStatement>(SQL`SELECT 1`)
expectType<SqlStatement>(SQL`SELECT `.append(SQL`1`))
expectType<SQL.SqlStatement>(SQL`SELECT `.append(SQL`1`))
expectType<SqlStatement>(glue([SQL`SELECT`, SQL`1`], ' '))
expectType<SQL.SqlStatement>(SQL.glue([SQL`SELECT`, SQL`1`], ' '))
expectType<SQL.SqlStatement>(SQL.map([1,2,3]))
expectType<SQL.SqlStatement>(SQL.map([1,2,3], x => x**2))
expectType<SQL.SqlStatement>(map([1,2,3]))
expectType<SQL.SqlStatement>(map([1,2,3], x => x**2))
expectType<string>(SQL`SELECT 1`.debug)
expectType<string>(SQL`SELECT 1`.sql)
expectType<string>(SQL`SELECT 1`.text)
expectType<{ value: string }>(SQL.unsafe('string'))
expectType<{ value: number }>(SQL.unsafe(1))
expectType<{ value: string }>(SQL.quoteIdent('string'))
expectError(SQL`SELECT `.append(`1`))
