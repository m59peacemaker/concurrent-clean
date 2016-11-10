# concurrent-clean

Executes functions concurrently with opportunity to cleanup if any fail.

## install

```sh
npm install concurrent-clean
```

## example

```js
const concurrent = require('concurrent-clean')

concurrent([
  (cb) => {
    const asyncOperation = foo(cb)

    return () => {
      // called if any other functions encountered errors and `cb` hasn't been called yet
      asyncOperation.cancel(cb)
    }
  },
  (cb) => {
    const asyncOperation = bar(cb)
    return () => {
      asyncOperation.stop(cb)
    }
  }
], (errors, results => {
  errors // -> undefined or array of errors
  results // -> array of results from each function in order
})
```

## API

### `concurrent(functions, [options], cb)`

- `functions: []` array of functions that will be passed a node-style `cb` and be called concurrently. Functions can return a cleanup function that will be called if there are any errors so that there is an opportunity to cancel asynchronous operations in other functions. The cleanup function will not be called if the function has already called its callback.
- `options: object`
  - `ignoreErrors: boolean, false` when true, cleanup functions will not be called and results will be returned even if there are errors
- `cb: (errors, results) => {}` callback to be called after all functions call their callback
  - `errors: undefined or []` undefined if there are no errors or an array if there are
  - `results: [] or undefined` results from each function unless there are errors
