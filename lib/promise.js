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
  if (!utils.isCallable(executor)) {
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

  // 8. If completion is an abrupt completion, then
  //      Let status be Call(resolvingFunctions.[[Reject]], undefined, «completion.[[value]]»).
  //      ReturnIfAbrupt(status).
  // Didn't implement

  // 9. Return promise.
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
    if (!resolution || typeof resolution !== 'object') {
      // TODO fulfillPromise
      return fulfillPromise(promise, resolution);
    }

    // Let then be Get(resolution, "then").
    // Let then be then.[[value]].
    var then = resolution.then;

    // If IsCallable(then) is false, then
    if (typeof then !== 'function') {
      // Return FulfillPromise(promise, resolution).
      return fulfillPromise(promise, resolution);
    }

    // Perform EnqueueJob ("PromiseJobs", PromiseResolveThenableJob, «‍promise, resolution, then»)
    // Return undefined.
    // TODO
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
 * fulfill a promise
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-fulfillpromise
 *
 * @param {Object} promise
 * @param {Object} value
 */

function fulfillPromise(promise, value) {
  // 1. Assert: the value of promise's [[PromiseState]] internal slot is "pending".
  assert(promise._state === constant.PENDING);

  // 2. Let reactions be the value of promise's [[PromiseFulfillReactions]] internal slot.
  var reactions = promise._fulfillReactions;

  // 3. Set the value of promise's [[PromiseResult]] internal slot to value.
  promise._result = value;

  // 4. Set the value of promise's [[PromiseFulfillReactions]] internal slot to undefined.
  promise._fulfillReactions = undefined;

  // 5. Set the value of promise's [[PromiseRejectReactions]] internal slot to undefined.
  promise._rejectReactions = undefined;

  // 6. Set the value of promise's [[PromiseState]] internal slot to "fulfilled".
  promise._state = constant.FULFILLED;

  // 7. Return TriggerPromiseReactions(reactions, value).
  return triggerPromiseReactions(reactions, value);
}

/**
 * reject a promise
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-rejectpromise
 *
 * @param {Object} promise
 * @param {Object} reason
 */

function rejectPromise(promise, reason) {
  // 1. Assert: the value of promise's [[PromiseState]] internal slot is "pending".
  assert(promise._state === constant.PENDING);

  // 2. Let reactions be the value of promise's [[PromiseRejectReactions]] internal slot.
  var reactions = promise._rejectReactions;

  // 3.  Set the value of promise's [[PromiseResult]] internal slot to reason.
  promise._result = reason;

  // 4. Set the value of promise's [[PromiseFulfillReactions]] internal slot to undefined.
  promise._fulfillReactions = undefined;

  // 5. Set the value of promise's [[PromiseRejectReactions]] internal slot to undefined.
  promise._rejectReactions = undefined;

  // 6. Set the value of promise's [[PromiseState]] internal slot to "rejected".
  promise._state = constant.REJECTED;

  // 7. Return TriggerPromiseReactions(reactions, reason).
  return triggerPromiseReactions(reactions, reason);
}

/**
 * trigger promise reactions
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-triggerpromisereactions
 *
 * @param {Array} reactions
 * @param {Object} arg
 */
function triggerPromiseReactions (reactions, arg) {
  // TODO
}

/**
 * promise'then method
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.prototype.then
 *
 * @param {Function} onFulfilled
 * @param {Function} onRejected
 * @return {Promise}
 */

Promise.prototype.then = function (onFulfilled, onRejected) {
  // Let promise be the this value.
  // If IsPromise(promise) is false, throw a TypeError exception.
  var promise = this;
  // Let C be SpeciesConstructor(promise, %Promise%).
  // Let resultCapability be NewPromiseCapability(C).
  var resultCapability = new promise.constructor(constant.NOOP);
  // Return PerformPromiseThen(promise, onFulfilled, onRejected, resultCapability).
  return perforPromiseThen(promise, onFulfilled, onRejected, resultCapability);
};

/**
 * perform `then` operation on promise using _onFulfilled_ and _onRejected_
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-performpromisethen
 *
 * @param {Promise} promise
 * @param {Function} onFulfilled
 * @param {Function} onRejected
 * @param {Promise} resultCapability
 * @return {Promise}
 */
function perforPromiseThen(promise, onFulfilled, onRejected, resultCapability) {
  // Assert: IsPromise(promise) is true.
  // Assert: resultCapability is a PromiseCapability record.

  // If IsCallable(onFulfilled) is false, then let onFulfilled be "Identity".
  if (!utils.isCallable(onFulfilled)) {
    onFulfilled = constant.IDENTITY;
  }

  // If IsCallable(onRejected) is false, then let onRejected be "Thrower".
  if (!utils.isCallable(onRejected)) {
    onRejected = constant.THROWER;
  }

  // Let fulfillReaction be the PromiseReaction { [[Capabilities]]: resultCapability, [[Handler]]: onFulfilled }.
  var fulfillReactions = {
    capabilities: resultCapability,
    handler: onFulfilled
  };

  // Let rejectReaction be the PromiseReaction { [[Capabilities]]: resultCapability, [[Handler]]: onRejected}.
  var rejectReaction = {
    capabilities: resultCapability,
    handler: onRejected
  };

  // If the value of promise's [[PromiseState]] internal slot is "pending"
  if (promise._state === constant.PENDING) {
    // Append fulfillReaction as the last element of the List that is the value of promise's [[PromiseFulfillReactions]] internal slot.
    promise._fulfillReactions.push(fulfillReaction);

    // Append rejectReaction as the last element of the List that is the value of promise's [[PromiseRejectReactions]] internal slot.
    promise._rejectReactions.push(rejectReaction);
  } else if (promise._state === constant.FULFILLED) {
    // Let value be the value of promise's [[PromiseResult]] internal slot.
    var value = promise._result;

    // Perform EnqueueJob("PromiseJobs", PromiseReactionJob, «‍fulfillReaction, value»).
    // TODO
  } else if (promise_state === constant.REJECTED) {
    // Let reason be the value of promise's [[PromiseResult]] internal slot.
    var reason = promise._result;

    // Perform EnqueueJob("PromiseJobs", PromiseReactionJob, «‍rejectReaction, reason»).
    // TODO
  }
  return resultCapability;
}
