const test = require('tape')
const concurrent = require('../')

test('runs functions concurrently', t => {
  t.plan(1)
  const fn = (cb) => setTimeout(() => cb(undefined), 500)
  const startTime = new Date().getTime()
  concurrent([fn, fn, fn, fn], (err, results) => {
    if (err) { return t.fail(err) }
    const totalTime = new Date().getTime() - startTime
    t.true(totalTime < 1000, `Took: ${totalTime}ms`)
  })
})

test('passes ordered results to the callback', t => {
  t.plan(1)
  const Fn = (result) => {
    return (cb) => setTimeout(() => cb(undefined, result), 0)
  }
  const expected = ['a', 'b', 'c']
  concurrent(expected.map(v => Fn(v)), (err, results) => {
    if (err) { return t.fail(err) }
    t.deepEqual(results, expected)
  })
})

test('passes errors to the callback if any functions call cb(err)', t => {
  t.plan(1)
  const Fn = (result) => {
    return (cb) => setTimeout(() => cb(undefined, result), 0)
  }
  const errFn = (cb) => cb(123)
  concurrent([Fn('a'), errFn, Fn('c')], (err, results) => {
    t.deepEqual(err, [undefined, 123, undefined])
  })
})

test('calls cleanup functions if a function calls cb(err)', t => {
  t.plan(2)
  const a = (cb) => {
    cb('error')
    return () => {
      setTimeout(() => {
        t.pass()
        cb()
      }, 500)
    }
  }
  const b = (cb) => {
    return () => {
      setTimeout(() => {
        t.pass()
        cb()
      }, 500)
    }
  }
  concurrent([a, b], () => {})
})

test('calls cleanup functions before final callback', t => {
  t.plan(2)
  let cleanupFnsCalled = 0
  const a = (cb) => {
    cb('error')
    return () => {
      setTimeout(() => {
        ++cleanupFnsCalled
        cb()
      }, 500)
    }
  }
  const b = (cb) => {
    return () => {
      setTimeout(() => {
        ++cleanupFnsCalled
        cb()
      }, 500)
    }
  }
  concurrent([a, b], (errors, results) => {
    t.equal(cleanupFnsCalled, 2, 'cleanup fns were called before final callback')
    t.deepEqual(errors, ['error', undefined])
  })
})
