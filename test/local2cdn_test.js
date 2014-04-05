'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.local2cdn = {
  setUp: function(done) {
    // setup here if necessary
    done();
  },
  'Plain CSS file': function(test) {
    var actual, expected;
    test.expect(1);
    actual = grunt.file.read('test/dist/sample.css');
    expected = grunt.file.read('test/expected/sample.css');
    test.equal(actual, expected);
    test.done();
  },

  'HTML file including embedded CSS': function(test) {
    var actual, expected;
    test.expect(1);
    actual = grunt.file.read('test/dist/sample.html');
    expected = grunt.file.read('test/expected/sample.html');
    test.equal(actual, expected);
    test.done();
  },

  'EJS file including embedded CSS': function(test) {
    var actual, expected;
    test.expect(1);
    actual = grunt.file.read('test/dist/sample.ejs');
    expected = grunt.file.read('test/expected/sample.ejs');
    test.equal(actual, expected);
    test.done();
  }
};
