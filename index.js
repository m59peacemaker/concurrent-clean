var nextTick = require('next-tick')
var isNil = require('is-nil')
var once = require('call-once')

var wrap = function (wrapper, fn) {
  return function () {
    var args = arguments
    return wrapper(function () {
      return fn.apply(undefined, args)
    })
  }
}

var ensureAsync = function (fn) {
  return wrap(nextTick, fn)
}

/*var ensureAsync = function (fn) {
  return function () {
    var args = arguments
    return nextTick(function () {
      return fn.apply(undefined, args)
    })
  }
}*/

var concurrent = function (functions, finalCb) {
  var completed = 0
  var results = []
  var errors = []
  var hasErr = false
  var cleanupFns = functions.map(function (fn, idx) {
    var fnCb = function (err, result) {
      if (!hasErr && !isNil(err)) {
        hasErr = true
        cleanupFns.forEach(function (fn) {
          fn()
        })
      }
      ++completed
      errors[idx] = err
      results[idx] = result
      if (completed === functions.length) {
        finalCb(hasErr ? errors : undefined, results)
      }
    }
    var preparedCb = once(ensureAsync(fnCb))
    var cleanupFn = fn(preparedCb)
    return cleanupFn
  }).filter(function (v) {
    return typeof v === 'function'
  })
}

module.exports = concurrent
