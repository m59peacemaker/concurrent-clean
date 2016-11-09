# concurrent-clean

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

    return () => { // called if any callback is called with err
      asyncOperation.cancel(cb)
    }
  },
  (cb) => {
    const asyncOperation = bar()
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

### `concurrent(functions, cb)`

- `functions: []` array of functions that will be passed a node-style `cb` and be called concurrently
- `cb: (errors, results) => {}` callback to be called after all functions call their callback.
  - `errors: undefined or []` undefined if there are no errors or an array if there are.
  - `results: []` results from each function
