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

test('no results if there are errors', t => {
  t.plan(1)
  const a = (cb) => {
    setTimeout(() => cb(undefined, 'hey'), 500)
  }
  const b = (cb) => {
    setTimeout(() => {
      cb('error')
    }, 100)
  }
  const c = (cb) => {
    setTimeout(() => cb('fail!'), 500)
  }
  concurrent([a, b, c], (errors, results) => {
    t.equal(results, undefined, 'no results')
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
  t.plan(1)
  const a = (cb) => cb('error')
  const b = (cb) => {
    return () => {
      t.pass('"b" cleanup called')
      cb()
    }
  }
  concurrent([a, b], () => {})
})

test('does not call cleanup fn if main function already completed', t => {
  t.plan(1)
  const a = (cb) => {
    cb('error')
    return () => t.fail('"a" cleanup called')
  }
  const b = (cb) => {
    cb()
    return () => t.fail('"b" cleanup called')
  }
  concurrent([a, b], () => t.pass('cleanups not called'))
})

test('calls cleanup functions before final callback', t => {
  t.plan(2)
  let cleanupFnsCalled = 0
  const a = (cb) => cb('error')
  const b = (cb) => {
    return () => {
      setTimeout(() => {
        ++cleanupFnsCalled
        cb()
      }, 500)
    }
  }
  concurrent([a, b], (errors, results) => {
    t.equal(cleanupFnsCalled, 1, 'cleanup fns were called before final callback')
    t.deepEqual(errors, ['error', undefined])
  })
})

test('ignoreErrors: true, does not call cleanup functions', t => {
  t.plan(1)
  let cleanupsCalled = 0
  const a = (cb) => {
    setTimeout(cb, 500)
    return () => {
      ++cleanupsCalled
    }
  }
  const b = (cb) => {
    setTimeout(() => {
      cb('error')
    }, 100)
  }
  const c = (cb) => {
    setTimeout(cb, 500)
    return () => {
      ++cleanupsCalled
    }
  }

  concurrent([a, b, c], {ignoreErrors: true}, () => {
    t.equal(cleanupsCalled, 0, 'no cleanup functions were called')
  })
})

test('ignoreErrors: true, collects all errors in order', t => {
  t.plan(1)
  const a = (cb) => {
    setTimeout(cb, 500)
  }
  const b = (cb) => {
    setTimeout(() => {
      cb('error')
    }, 100)
  }
  const c = (cb) => {
    setTimeout(() => cb('fail!'), 500)
  }
  concurrent([a, b, c], {ignoreErrors: true}, (errors) => {
    t.deepEqual(errors, [undefined, 'error', 'fail!'])
  })
})

test('ignoreErrors: true, errors from cleanup functions are used', t => {
  t.plan(1)
  const a = (cb) => {
    return () => {
      cb('fail!')
    }
  }
  const b = (cb) => {
    setTimeout(() => {
      cb('error')
    }, 100)
  }
  const c = (cb) => {
    setTimeout(() => cb(undefined, 'hey'), 500)
  }

  concurrent([a, b, c], (errors) => {
    t.deepEqual(errors, ['fail!', 'error', undefined])
  })
})

test('ignoreErorrs: true, has results when there are errors', t => {
  t.plan(1)
  const a = cb => cb('error')
  const b = cb => cb(undefined, 'abc')
  concurrent([a, b], {ignoreErrors: true}, (errors, results) => {
    t.deepEqual(results, [undefined, 'abc'])
  })
})
