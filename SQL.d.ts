declare namespace SQL {
  export class SqlStatement {
    public constructor(strings: TemplateStringsArray, values: any[])

    public append(statement: SqlStatement, options?: { unsafe?: boolean }): this
    public generateString(type: 'pg' | 'mysql'): string
    public glue(pieces: SqlStatement[], separator: string): SqlStatement

    public get debug(): string
    public get sql(): string
    public get text(): string
  }

  export function glue(pieces: SqlStatement[], separator: string): SqlStatement
}

declare function SQL(strings: TemplateStringsArray, ...values: any[]): SQL.SqlStatement

export = SQL
