import * as SQL from './sql'
import { expectType, expectError } from 'tsd'

expectType<SQL.SqlStatement>(SQL`SELECT 1`)
expectType<SQL.SqlStatement>(SQL`SELECT `.append(SQL`1`))
expectType<SQL.SqlStatement>(SQL.glue([SQL`SELECT`, SQL`1`], ' '))
expectType<string>(SQL`SELECT 1`.debug)
expectType<string>(SQL`SELECT 1`.sql)
expectType<string>(SQL`SELECT 1`.text)
expectError(SQL`SELECT `.append(`1`))
