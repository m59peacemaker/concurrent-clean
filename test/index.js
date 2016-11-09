const test = require('tape')
const concurrent = require('../')

test('runs functions concurrently', t => {
  t.plan(1)
  const fn = (cb) => setTimeout(() => cb(undefined), 500)
  const startTime = new Date().getTime()
  concurrent([fn, fn, fn, fn], (err, results) => {
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
    t.deepEqual(results, expected)
  })
})

test('passes err to the callback if a function calls cb(err)', t => {
  t.plan(1)
  const Fn = (result) => {
    return (cb) => setTimeout(() => cb(undefined, result), 0)
  }
  const errFn = (cb) => cb(123)
  concurrent([Fn('a'), errFn, Fn('c')], (err, results) => {
    t.equal(err, 123)
  })
})

test('no results passed to callback if a function calls cb(err)', t => {
  t.plan(1)
  const Fn = (result) => (cb) => cb(undefined, result)
  const errFn = (cb) => cb(123)
  concurrent([Fn('a'), Fn('b'), errFn], (err, results) => {
    t.equal(results, undefined)
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
  concurrent([a, b], (err, result) => {})
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
  concurrent([a, b], (err, result) => {
    t.equal(cleanupFnsCalled, 2, 'cleanup fns were called before final callback')
    t.deepEqual([err, result], ['error', undefined])
  })
})
