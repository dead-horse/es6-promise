/*!
 * my-es6-promise - lib/queue.js
 * Copyright(c) 2015 dead_horse <dead_horse@qq.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module exports.
 */

module.exports = Queue;

var asap = typeof setImmediate === 'function'
  ? setImmediate
  : process.nextTick;

/**
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-jobs-and-job-queues
 */

function Queue() {
  this.jobs = [];
  this.running = false;
}

Queue.prototype.enqueue = function (job) {
  if (!this.running) {
    var queue = this;
    asap(function () {
      queue.run();
    });
  }
  this.jobs.push(job);
};

Queue.prototype.run = function() {
  if (this.running) return;
  this.running = true;
  for (var i = 0, jobs = this.jobs; i < jobs.length; i++) {
    jobs[i]();
  }
  this.jobs = [];
  this.running = false;
};
