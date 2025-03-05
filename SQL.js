'use strict';

const inspect = Symbol.for('nodejs.util.inspect.custom');
const wrapped = Symbol('wrapped');
const quoteIdentifier = require('./quoteIdentifier');

class SqlStatement {
  constructor(strings, values) {
    if (values.some(value => value === undefined)) {
      throw new Error('SQL`...` strings cannot take `undefined` as values as this can generate invalid SQL.');
    }
    this.strings = strings;
    this._values = values;
  }

  glue(pieces, separator) {
    const result = { strings: [], values: [] };
    let carryover;

    for (let i = 0; i < pieces.length; i++) {
      const strings = [...pieces[i].strings];
      if (i > 0) {
        strings[0] = carryover + separator + strings[0];
      }
      carryover = strings.pop();
      result.strings.push(...strings);
      result.values.push(...pieces[i]._values);
    }

    result.strings.push(carryover + ' ');

    return new SqlStatement(result.strings, result.values);
  }

  map(array, mapFunc = i => i) {
    return array?.length > 0 && mapFunc instanceof Function
      ? this.glue(array.map(mapFunc).map(item => SQL`${item}`), ',')
      : null;
  }

  _generateString(type, namedValueOffset = 0) {
    let text = this.strings[0];
    let valueOffset = 0;
    const values = [...this._values];

    for (let i = 1; i < this.strings.length; i++) {
      const valueIndex = i - 1 + valueOffset;
      const valueContainer = values[valueIndex];

      if (valueContainer?.[wrapped]) {
        text += `${valueContainer.transform(type)}${this.strings[i]}`;
        values.splice(valueIndex, 1);
        valueOffset--;
      } else if (valueContainer instanceof SqlStatement) {
        text += `${valueContainer._generateString(type, valueIndex + namedValueOffset)}${this.strings[i]}`;
        valueOffset += valueContainer.values.length - 1;
        values.splice(valueIndex, 1, ...valueContainer.values);
      } else {
        text += (type === 'pg' ? `$${i + valueOffset + namedValueOffset}` : '?') + this.strings[i];
      }
    }

    return text.trim().replace(/\s+/g, ' ');
  }

  get debug() {
    return this.strings.reduce((text, str, i) => {
      if (i === 0) return str;

      let value = this._values[i - 1];
      let quote = "'";

      if (value?.[wrapped]) {
        value = value.transform();
        quote = '';
      } else if (value instanceof SqlStatement) {
        value = value.debug;
        quote = '';
      }

      return text + (typeof value === 'string' ? quote + value + quote : value) + str;
    }).trim().replace(/\s+/g, ' ');
  }

  [inspect]() {
    return `SQL << ${this.debug} >>`;
  }

  get text() {
    return this._generateString('pg');
  }

  get sql() {
    return this._generateString('mysql');
  }

  get values() {
    return this._values.reduce((acc, v) => {
      if (!v?.[wrapped]) {
        acc.push(...(v instanceof SqlStatement ? v.values : [v]));
      }
      return acc;
    }, []);
  }

  append(statement, options) {
    if (!statement || !(statement instanceof SqlStatement)) {
      throw new Error('"append" accepts only template strings prefixed with SQL (SQL`...`)');
    }

    if (options?.unsafe) {
      const text = statement.strings.reduce((acc, str, i) => acc + str + (statement.values[i] ?? ''), '');
      this.strings[this.strings.length - 1] += text;
      return this;
    }

    this.strings = [...this.strings.slice(0, -1), this.strings.at(-1) + statement.strings[0], ...statement.strings.slice(1)];
    this._values.push(...statement._values);

    return this;
  }
}

function SQL(strings, ...values) {
  return new SqlStatement(strings, values);
}

SQL.glue = SqlStatement.prototype.glue;
SQL.map = SqlStatement.prototype.map;

module.exports = SQL;
module.exports.SQL = SQL;
module.exports.default = SQL;
module.exports.unsafe = value => ({ transform: () => value, [wrapped]: true });
module.exports.quoteIdent = value => ({ transform: type => quoteIdentifier(value, type), [wrapped]: true });
