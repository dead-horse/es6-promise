/*!
 * es6-promise - lib/promise.js
 * Copyright(c) 2014 dead_horse <dead_horse@qq.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module exports.
 */

exports.PENDING = 'pending';
exports.REJECTED = 'reject';
exports.FULFILLED = 'fulfilled';

exports.NOOP = function () {};

exports.IDENTITY = function (arg) {
  return arg;
};

exports.THROWER = function (exception) {
  throw exception;
};
