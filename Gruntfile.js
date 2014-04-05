/*
 * grunt-local2cdn
 * https://github.com/meronmee/grunt-local2cdn
 *
 * Copyright (c) 2013 meronmee
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },

    // Configuration to be run (and then tested).
    local2cdn: {
      main: {
          options: {
              prefix: 'http://cdn.bootcss.com/',
              maps: {
                  'jquery.js': 'jquery/2.0.3/jquery.min.js',
                  'bootstrap.js': 'bootstrap/3.1.1/js/bootstrap.min.js',
                  'bootstrap.css': '/bootstrap/3.1.1/css/bootstrap.min.css',
                  'foo.png': '/xxx/foo.png',
                  'foo.jpg': '/xxx/foo.jpg',
                  'foo.gif': '/xxx/foo.gif',
                  'foo.tif': '/xxx/foo.tif:image'
              }/*,
              maps: [
                   {local: 'jquery.js', cdn: 'jquery/2.0.3/jquery.min.js', prefix:'//cdn.a.com', regex:true, srcType:'image'},
                   {local: 'bootstrap.js', cdn: 'bootstrap/3.1.1/js/bootstrap.min.js', prefix:'http://cdn.2.org', regex:true},
                   {local: 'bootstrap.css', cdn: '/bootstrap/3.1.1/css/bootstrap.min.css'},
                   {local: 'foo.png', cdn: '/xxx/foo.png', prefix:'http://cdn.3.org'},
                   {local: 'foo.jpg', cdn: '/xxx/foo.jpg'},
                   {local: 'foo.gif', cdn: '/xxx/foo.gif'},
                   {local: 'foo.tif', cdn: '/xxx/foo.tif', srcType:'image'},
                   {local: '^foo', cdn: '/xxx/foo.pic?123#$#image', separator:'#$#',  regex:true}
              ]*/
          },
          files: [
              {
                expand: true,
                cwd: 'test/src',
                src: '**/*.{css,html,ejs}',
                dest: 'test/dist'
              }
          ]
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'local2cdn', 'nodeunit']);
  
  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test2', ['clean', 'local2cdn']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);
  
};
