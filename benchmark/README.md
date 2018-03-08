# Benchmark
We're using https://www.npmjs.com/package/benchmark module to do the benchmarking. Below you can see results and how to run it locally

You can check the code in `index.js` file. We're comparing the speed with https://www.npmjs.com/package/sql-template-strings module.

## Usage

```bash
npm run benchmark
```

## Results
```bash
➜  sql git:(master) ✗ npm run benchmark
@nearform/sql x 9,621,960 ops/sec ±1.57% (82 runs sampled)
sql-template-strings x 286,461 ops/sec ±1.74% (81 runs sampled)
The fastest is @nearform/sql
```

The module can execute 9,621,960 operations per second.
