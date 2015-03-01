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
var Queue = require('./queue');

var promiseJobs = new Queue();

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
  assert(utils.isCallable(executor), 'executor must be a function');

  // 3. Set promise's [[PromiseState]] internal slot to "pending".
  promise._state = constant.PENDING;

  // 4. Set promise's [[PromiseFulfillReactions]] internal slot to a new empty List.
  promise._fulfillReactions = [];

  // 5. Set promise's [[PromiseRejectReactions]] internal slot to a new empty List.
  promise._rejectReactions = [];

  // 6. Let resolvingFunctions be CreateResolvingFunctions(promise).
  var resolvingFunctions = createResolvingFunctions(promise);

  // 7. Let completion be Call(executor, undefined, resolvingFunctions.[[Resolve]], resolvingFunctions.[[Reject]]).
  var completion = utils.Call(executor, undefined, resolvingFunctions);

  // 8. If completion is an abrupt completion, then
  //      Let status be Call(resolvingFunctions.[[Reject]], undefined, 芦completion.[[value]]禄).
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
  return [resolve, reject];

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

    // 5. Set alreadyResolved.[[value]] to true.
    alreadyResolved.value = true;

    // 6. If SameValue(resolution, promise) is true, then
    if (utils.sameValue(resolution, promise)) {
      // a. Let selfResolutionError be a newly-created TypeError object.
      var selfResolutionError = new TypeError('You cannot resolve a promise with itself');
      // b. Return RejectPromise(promise, selfResolutionError).
      return rejectPromise(promise, selfResolutionError);
    }

    // 7. If Type(resolution) is not Object, then
    if (!resolution || typeof resolution !== 'object') {
      // TODO fulfillPromise
      // a. Return FulfillPromise(promise, resolution).
      return fulfillPromise(promise, resolution);
    }

    // 8. Let then be Get(resolution, "then").
    var then;
    try {
      then = resolution.then;
    } catch (err) {
      // 9. If then is an abrupt completion, then
      // Return RejectPromise(promise, then.[[value]]).
      return rejectPromise(promise, err);
    }

    // If IsCallable(then) is false, then
    if (typeof then !== 'function') {
      // Return FulfillPromise(promise, resolution).
      return fulfillPromise(promise, resolution);
    }

    // Perform EnqueueJob ("PromiseJobs", PromiseResolveThenableJob, Promise, resolution, then)
    // Return undefined.
    promiseJobs.enqueue(
      // 25.4.2.2 http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promiseresolvethenablejob
      function promiseResolveThenableJob() {
        // 1. Let resolvingFunctions be CreateResolvingFunctions(promiseToResolve).
        var resolvingFunctions = createResolvingFunctions(promise);
        // 2. Let thenCallResult be Call(then, thenable, <resolvingFunctions.[[Resolve]], resolvingFunctions.[[Reject]]>)
        try {
          utils.Call(then, resolution, resolvingFunctions);
        } catch (err) {
          // 3. If thenCallResult is an abrupt completion,
          // a. Let status be Call(resolvingFunctions.[[Reject]], <undefined, thenCallResult.[[value]]>).
          resolvingFunctions[1](err);
        }
    });
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
function triggerPromiseReactions(reactions, arg) {
  for (var i = 0; i < reactions.length; i++) {
    var reaction = reactions[i];
    promiseJobs.enqueue(
    // 25.4.2.1 http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promisereactionjob
    function() {
      var promiseCapability = reaction.capabilities;
      var handler = reaction.handler;
      promiseReactionJob(promiseCapability.resolve, promiseCapability.reject, handler, arg);
    });
  }
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
  var resultCapability = newPromiseCapability(promise.constructor);
  // Return PerformPromiseThen(promise, onFulfilled, onRejected, resultCapability).
  return performPromiseThen(promise, onFulfilled, onRejected, resultCapability);
};

Promise.prototype.catch = function (onRejected) {
  return this.then(undefined, onRejected);
};

Promise.all = function (iterable) {
  var promiseCapability = newPromiseCapability(this);

  var values = [];
  var remainingElementsCount = 1;
  var index = 0;

  return promiseCapability.promise;
}

Promise.reject = function (r) {
  var promiseCapability = newPromiseCapability(this);
  promiseCapability.reject(r);
  return promiseCapability.promise;
};

/**
 * 25.4.1.5 http://people.mozilla.org/~jorendorff/es6-draft.html#sec-newpromisecapability
 *
 * @param {Constructor} C
 * @return {Object}
 */
function newPromiseCapability(C) {
  if (typeof C !== 'function') throw new TypeError('C must be constructor');
  var promiseCapability = {};

  promiseCapability.promise = new C(function (resolve, reject) {
    promiseCapability.resolve = resolve;
    promiseCapability.reject = reject;
  });

  if (!utils.isCallable(promiseCapability.resolve)) throw new TypeError('promiseCapability.resolve must be callable');
  if (!utils.isCallable(promiseCapability.reject)) throw new TypeError('promiseCapability.reject must be callable');
  return promiseCapability;
}

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
function performPromiseThen(promise, onFulfilled, onRejected, resultCapability) {
  // Assert: IsPromise(promise) is true.
  // Assert: resultCapability is a PromiseCapability record.

  var resolve = resultCapability.resolve;
  var reject = resultCapability.reject;
  var result = promise._result;

  // If IsCallable(onFulfilled) is false, then let onFulfilled be "Identity".
  if (!utils.isCallable(onFulfilled)) {
    onFulfilled = function () {
      resolve(result);
    };
  }

  // If IsCallable(onRejected) is false, then let onRejected be "Thrower".
  if (!utils.isCallable(onRejected)) {
    onRejected = function () {
      reject(result);
    };
  }

  // Let fulfillReaction be the PromiseReaction { [[Capabilities]]: resultCapability, [[Handler]]: onFulfilled }.
  var fulfillReaction = {
    capabilities: resultCapability,
    handler: onFulfilled
  };

  // Let rejectReaction be the PromiseReaction { [[Capabilities]]: resultCapability, [[Handler]]: onRejected}.
  var rejectReaction = {
    capabilities: resultCapability,
    handler: onRejected
  };

  switch(promise._state) {
  // If the value of promise's [[PromiseState]] internal slot is "pending"
  case constant.PENDING:
    // Append fulfillReaction as the last element of the List that is the value of promise's [[PromiseFulfillReactions]] internal slot.
    // Append rejectReaction as the last element of the List that is the value of promise's [[PromiseRejectReactions]] internal slot.
    promise._fulfillReactions.push(fulfillReaction);
    promise._rejectReactions.push(rejectReaction);
    break;

  case constant.FULFILLED:
    // Perform EnqueueJob("PromiseJobs", PromiseReactionJob, <fulfillReaction, value>).
    promiseJobs.enqueue(function () {
      promiseReactionJob(resolve, reject, onFulfilled, result);
    });
    break;
  case constant.REJECTED:
    // Perform EnqueueJob("PromiseJobs", PromiseReactionJob, <fulfillReaction, value>).
    promiseJobs.enqueue(function () {
      promiseReactionJob(resolve, reject, onRejected, result);
    });
  }

  return resultCapability.promise;
}

/**
 * 25.4.2.1 http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promisereactionjob
 *
 * @param {Function} resolve
 * @param {Function} reject
 * @param {Function} reaction
 * @param {Mixed} result
 */
function promiseReactionJob(resolve, reject, reaction, result) {
  var handlerResult;
  try {
    handlerResult = reaction(result);
  } catch (err) {
    reject(err);
  }
  resolve(handlerResult);
}
