var nextTick = require('next-tick')

var ensureAsync = function (fn) {
  return function () {
    var args = arguments
    nextTick(function () {
      fn.apply(undefined, args)
    })
  }
}

var concurrent = function (fns, finalCb) {
  var completed = 0
  var results = []
  var firstErr
  var cleanupFns = fns.map(function (fn, idx) {
    var fnCb = function (err, result) {
      if (firstErr === undefined && err !== undefined) {
        firstErr = err
        cleanupFns.forEach(function (fn) {
          fn()
        })
      }
      ++completed
      results[idx] = result
      if (completed === fns.length) {
        finalCb(firstErr, firstErr === undefined ? results : undefined)
      }
    }
    var cleanupFn = fn(ensureAsync(fnCb))
    return cleanupFn
  }).filter(function (v) {
    return typeof v === 'function'
  })
}

module.exports = concurrent
