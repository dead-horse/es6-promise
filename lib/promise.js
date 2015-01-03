/*!
 * es6-promise - lib/promise.js
 * Copyright(c) 2014 dead_horse <dead_horse@qq.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var constant = require('./constant');
var fmt = require('util').format();
var utils = require('./utils');
var assert = require('assert');

/**
 * Module exports.
 */

module.exports = Promise;


/**
 * Promise
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise-executor
 *
 * @param {Function} executor
 * @return {Object} promise
 */

function Promise(executor) {
  // 1. Let promise be the this value.
  var promise = this;

  // 2. If Type(promise) is not Object, then throw a TypeError exception.
  if (typeof promise !== 'object') {
    throw new TypeError(fmt('%s is not a promise', promise));
  }

  // 3. If promise does not have a [[PromiseState]] internal slot, then throw a TypeError exception.
  // 4. If promise's [[PromiseState]] internal slot is not undefined, then throw a TypeError exception.
  this._state = undefined;

  // 5. If IsCallable(executor) is false, then throw a TypeError exception.
  if (!typeof executor === 'function'
    // v8's promise do not implement this
    // but http://people.mozilla.org/~jorendorff/es6-draft.html#sec-iscallable says this is a callable
    /*&& !(typeof executor === 'object' && typeof executor.call === 'function')*/) {
    throw new TypeError(fmt('%s is not a function', executor));
  }

  return initializePromise(promise, executor);
}

/**
 * The abstract operation InitializePromise initializes a newly allocated promise object using an executor function
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-initializepromise
 *
 * @param {Object} promise
 * @param {Function} executor
 * @return {Object} promise
 */

function initializePromise(promise, executor) {
  // 1. Assert: promise has a [[PromiseState]] internal slot and its value is undefined.
  assert(promise._state === undefined, 'uninitialized promise state must be undefined');

  // 2. Assert: IsCallable(executor) is true.
  assert(typeof executor === 'function', 'executor must be a function');

  // 3. Set promise's [[PromiseState]] internal slot to "pending".
  promise._state = constant.PENDING;

  // 4. Set promise's [[PromiseFulfillReactions]] internal slot to a new empty List.
  promise._fulfillReactions = [];

  // 5. Set promise's [[PromiseRejectReactions]] internal slot to a new empty List.
  promise._rejectReactions = [];

  // 6. Let resolvingFunctions be CreateResolvingFunctions(promise).
  var resolvingFunctions = createResolvingFunctions(promise);

  // 7. Let completion be Call(executor, undefined, «resolvingFunctions.[[Resolve]], resolvingFunctions.[[Reject]]»).
  var completion = executor(resolvingFunctions.resolve, resolvingFunctions.reject);

  // 8. Return promise.
  return promise;
}

/**
 * create new resolving functions
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-createresolvingfunctions
 *
 * @param {Object} promise
 * @return {Object} resolvingFunctions
 */

function createResolvingFunctions(promise) {
  // 1. Let alreadyResolved be a new Record { [[value]]: false }.
  var alreadyResolved = {
    value: false
  };

  // 8. Return a new Record { [[Resolve]]: resolve, [[Reject]]: reject }.
  return {
    resolve: resolve,
    reject: reject
  };

  // 2. Let resolve be a new built-in function object as defined in Promise Resolve Functions (25.4.1.4.2).
  // 3. Set the [[Promise]] internal slot of resolve to promise.
  // 4. Set the [[AlreadyResolved]] internal slot of resolve to alreadyResolved.
  function resolve(resolution) {
    // 1. Assert: F has a [[Promise]] internal slot whose value is an Object.
    assert(typeof promise === 'object');

    // 2. Let promise be the value of F's [[Promise]] internal slot.
    // 3. Let alreadyResolved be the value of F's [[AlreadyResolved]] internal slot.
    // 4. If alreadyResolved.[[value]] is true, then return undefined.
    if (alreadyResolved.value === true) {
      return undefined;
    }

    // Set alreadyResolved.[[value]] to true.
    alreadyResolved.value = true;

    // If SameValue(resolution, promise) is true, then
    if (utils.sameValue(resolution, promise)) {
      // Let selfResolutionError be a newly-created TypeError object.
      // Return RejectPromise(promise, selfResolutionError).
      var selfResolutionError = new TypeError('You cannot resolve a promise with itself');
      return rejectPromise(promise, selfResolutionError);
    }

    // If Type(resolution) is not Object, then
    // Return FulfillPromise(promise, resolution).
    if (typeof resolution !== 'object') {
      // TODO fulfillPromise
      return fulfillPromise(promise, resolution);
    }

    // Let then be Get(resolution, "then").
    var then = resolution.then;

    // Let then be then.[[value]].
    then.value = then;

    // If IsCallable(then) is false, then
    if (!typeof then === 'function') {
      // Return FulfillPromise(promise, resolution).
      return fulfillPromise(promise, resolution);
    }

    // Perform EnqueueJob ("PromiseJobs", PromiseResolveThenableJob, «‍promise, resolution, then»)
    // Return undefined.

  };

  // 5. Let reject be a new built-in function object as defined in Promise Reject Functions (25.4.1.4.1).
  // 6. Set the [[Promise]] internal slot of reject to promise.
  // 7. Set the [[AlreadyResolved]] internal slot of reject to alreadyResolved.
  // http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise-reject-functions
  function reject(reason) {
    // 1. Assert: F has a [[Promise]] internal slot whose value is an Object.
    assert(typeof promise === 'object');

    // 2. Let promise be the value of F's [[Promise]] internal slot.
    // 3. Let alreadyResolved be the value of F's [[AlreadyResolved]] internal slot.
    // 4. If alreadyResolved.[[value]] is true, then return undefined.
    if (alreadyResolved.value) {
      return undefined;
    }

    // 5. Set alreadyResolved.[[value]] to true.
    alreadyResolved.value = true;

    // 6. Return RejectPromise(promise, reason).
    return rejectPromise(promise, reason);
  };
}

/**
 * reject a promise
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-rejectpromise
 *
 * @param {Object} promise
 * @param {Object} reason
 */

function rejectPromise(promise, reason) {

  return function (reason) {

  }
}
