/*!
 * es6-promise - lib/utils.js
 * Copyright(c) 2014 dead_horse <dead_horse@qq.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

/**
 * check x and y are the same
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevalue
 *
 * @param {mixed} x
 * @param {mixed} y
 * @return {Boolean}
 */

exports.sameValue = function (x, y) {
  var typeofX = typeof x;
  var typeofY = typeof y;
  if (typeofX !== typeofY) {
    return false;
  }

  if (x === undefined || x === null) {
    return true;
  }

  if (typeofX === 'number') {
    if (Number.isNaN(x) && Number.isNaN(y)) {
      return true;
    }
    // TODO: -0 +0
    return x === y;
  }

  return x === y;
};

/**
 * check a object is callable or not
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-iscallable
 *
 * @param {Mixed} obj
 * @return {Boolean}
 */

exports.isCallable = function (obj) {
  if (typeof obj === 'function') return true;
  // If argument has a [[Call]] internal method, then return true, otherwise return false.
  // but v8's promise do not implement this
  if (obj && typeof obj === 'object' && typeof obj.call === 'function') return true;
  return false;
}

exports.noop = function () {};

exports.Call = function (F, V, args) {
  F.apply(V, args);
};

exports.iterator = function (iterable, fn) {
  var method = iterable['@@iterator'];
  if (!method) {
    if (iterable.length === undefined) throw new TypeError('not iterable');
    for (var i = 0; i < iterable.length; i++) {
      fn(iterable[i]);
    }
    return;
  }

  var iterator = method();
  if (typeof iterator !== 'object') throw new TypeError('iterator not an object');
  var ret;
  while (!(ret = iterator.next()).done) fn(ret.value);
};

exports.isObejct = function (val) {
  var type = typeof val;
  return type === 'object' || type === 'function';
};

exports.isPromise = function (val) {
  return exports.isObejct && val.hasOwnProperty('_state');
}
