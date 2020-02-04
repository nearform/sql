/** A tagged template containing strings and values */
export interface StatementLike {
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
export class SqlStatement implements StatementLike {
  constructor (strings: string[], values: any[])

  /** The string components of this tagged template */
  strings: string[]
  /** The value components of this tagged template */
  values: any[]

  /**
   * Safely glues multiple SQL statements together
   * @param pieces the statements to be glued
   * @param separator the glue separator placed between each statement
   */
  glue (pieces: StatementLike[], separator: string): SqlStatement

  /**
   * Safely glues multiple SQL statements together
   * @param pieces the statements to be glued
   * @param separator the glue separator placed between each statement
   */
  static glue (pieces: StatementLike[], separator: string): SqlStatement

  /**
   * Generates a PostgreSQL or MySQL statement string from this statement's strings and values
   * @param type the type of statement string to be generated
   */
  generateString (type?: 'pg' | 'mysql'): string

  /** Returns a formatted but unsafe statement of strings and values, useful for debugging */
  get debug (): string

  /** Returns a formatted statement suitable for use in PostgreSQL */
  get text (): string

  /** Returns a formatted statement suitable for use in MySQL */
  get sql (): string

  /**
   * Appends another statement onto this statement
   * @param statement a statement to be appended onto this existing statement
   * @param options allows disabling the safe template escaping while appending
   */
  append (statement: StatementLike, options?: StatementOptions): SqlStatement
}

/**
 * Create an SQL statement tagged template
 * @param strings template literal string components
 * @param values template literal value components
 * @example
 * SQL`SELECT id FROM customers WHERE name = ${userInput}`
 */
export function SQL (strings: any, ...values: any[]): SqlStatement
export default SQL
