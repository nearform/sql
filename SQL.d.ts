/** A tagged template containing strings and values */
interface StatementLike {
  strings: string[]
  values: any[]
}

interface StatementOptions {
  unsafe?: boolean
}

/**
 * An SQL statement tagged template
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
 */
declare class SqlStatement implements StatementLike {
  constructor(strings: string[], values: any[])

  /** The string components of this tagged template */
  strings: string[]

  /**
   * Safely glues multiple SQL statements together
   * @param pieces the statements to be glued
   * @param separator the glue separator placed between each statement
   * @example
   * const sql = SQL`SELECT id FROM customers WHERE `
   * sql.glue([
   *   sql,
   *   SQL`email = ${email}`
   * ])
   */
  glue(pieces: StatementLike[], separator: string): SqlStatement

  /**
   * Safely glues multiple SQL statements together
   * @param pieces the statements to be glued
   * @param separator the glue separator placed between each statement
   * @example
   * SQL.glue([
   *   SQL`SELECT id FROM customers WHERE `,
   *   SQL`email = ${email}`
   * ])
   * )
   */
  static glue(pieces: StatementLike[], separator: string): SqlStatement

  /**
   * A function that accepts an array of objects and a mapper function
   * It returns a clean SQL format using the object properties defined in the mapper function
   * @param array the items to be mapped over
   * @param mapFunc a function to transform the items in `array` before being added to the SqlStatement
   * @example
   * SQL`SELECT ${SQL.map([1,2,3])}`
   * @example
   * SQL`SELECT ${SQL.map([1,2,3], x => x ** 2)}`
   */
  map<T>(array: T[], mapFunc?: (item: T) => unknown): SqlStatement

  /**
   * A function that accepts an array of objects and a mapper function
   * It returns a clean SQL format using the object properties defined in the mapper function
   * @param array the items to be mapped over
   * @param mapFunc a function to transform the items in `array` before being added to the SqlStatement
   * @example
   * SQL`SELECT ${SQL.map([1,2,3])}`
   * @example
   * SQL`SELECT ${SQL.map([1,2,3], x => x ** 2)}`
   */
  static map<T>(array: T[], mapFunc?: (item: T) => unknown): SqlStatement

  /** Returns a formatted but unsafe statement of strings and values, useful for debugging */
  get debug(): string

  /** Returns a formatted statement suitable for use in PostgreSQL */
  get text(): string

  /** Returns a formatted statement suitable for use in MySQL */
  get sql(): string

  /** The value components of this tagged template */
  get values(): any[]

  /**
   * Appends another statement onto this statement
   * @deprecated Please append within template literals, e.g. SQL`SELECT * ${sql}`
   * @param statement a statement to be appended onto this existing statement
   * @param options allows disabling the safe template escaping while appending
   * @example
   * SQL`UPDATE users SET name = ${username}, email = ${email} `
   *   .append(SQL`SET ${dynamicName} = '2'`, { unsafe: true })
   *   .append(SQL`WHERE id = ${userId}`)
   */
  append(statement: StatementLike, options?: StatementOptions): SqlStatement
}

declare namespace SQL {
  export { SqlStatement }

  /**
   * Safely glues multiple SQL statements together
   * @param pieces the statements to be glued
   * @param separator the glue separator placed between each statement
   * @example
   * SQL.glue([
   *   SQL`SELECT id FROM customers WHERE `,
   *   SQL`email = ${email}`
   * ])
   * )
   */
  export function glue(pieces: StatementLike[], separator: string): SqlStatement

  /**
   * A function that accepts an array of objects and a mapper function
   * It returns a clean SQL format using the object properties defined in the mapper function
   * @param array the items to be mapped over
   * @param mapFunc a function to transform the items in `array` before being added to the SqlStatement
   * @example
   * SQL`SELECT ${SQL.map([1,2,3])}`
   * @example
   * SQL`SELECT ${SQL.map([1,2,3], x => x ** 2)}`
   */
  export function map<T>(array: T[], mapFunc?: (item: T) => unknown): SqlStatement

  export function unsafe<T>(value: T): { value: T }
  export function quoteIdent(value: string): { value: string }
}

/**
 * Create an SQL statement tagged template
 * @param strings template literal string components
 * @param values template literal value components
 * @example
 * SQL`SELECT id FROM customers WHERE name = ${userInput}`
 */
declare function SQL(strings: any, ...values: any[]): SqlStatement

export = SQL
