import SQL from '.'
import { glue, map, SqlStatement } from '.'
import { expect } from 'tstyche'

expect(SQL`SELECT 1`).type.toBe<SqlStatement>()
expect(SQL`SELECT 1`).type.toBe<SQL.SqlStatement>()
expect(SQL`SELECT `.append(SQL`1`)).type.toBe<SqlStatement>()
expect(SQL`SELECT `.append(SQL`1`)).type.toBe<SQL.SqlStatement>()
expect(glue([SQL`SELECT`, SQL`1`], ' ')).type.toBe<SqlStatement>()
expect(SQL.glue([SQL`SELECT`, SQL`1`], ' ')).type.toBe<SQL.SqlStatement>()
expect(SQL.map([1, 2, 3])).type.toBe<SQL.SqlStatement>()
expect(SQL.map([1, 2, 3], x => x ** 2)).type.toBe<SQL.SqlStatement>()
expect(map([1, 2, 3])).type.toBe<SQL.SqlStatement>()
expect(map([1, 2, 3], x => x ** 2)).type.toBe<SQL.SqlStatement>()
expect(SQL`SELECT 1`.debug).type.toBe<string>()
expect(SQL`SELECT 1`.sql).type.toBe<string>()
expect(SQL`SELECT 1`.text).type.toBe<string>()
expect(SQL.unsafe('string')).type.toBe<{ value: string }>()
expect(SQL.unsafe(1)).type.toBe<{ value: number }>()
expect(SQL.quoteIdent('string')).type.toBe<{ value: string }>()
expect(SQL`SELECT `.append).type.not.toBeCallableWith(`1`)
