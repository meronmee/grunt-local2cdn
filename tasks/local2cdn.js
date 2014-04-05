/*
 * grunt-local2cdn
 * https://github.com/meronmee/grunt-local2cdn
 *
 * Copyright (c) 2013 meronmee
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
var Soup = require('soup');
var rewriteCSSURLs = require('css-url-rewriter');
var util = require('util');

/**
 * Helper functions
 */
/**
 * 判断是否是本地资源路径
 * 非本地资源资源的路径将不予处理
 */
function isLocalPath(filePath) {
  return (
    typeof filePath === 'string' && filePath.length &&
    (filePath.indexOf('//') === -1) &&
    (filePath.indexOf('data:') !== 0)
  );
}

/**
 * 格式化路径，
 * - 将\转为/,
 * - 去除多余的/
 */
function normalizePath(path){
  if(!path){return '';}
  return (''+path).replace(/\\/g, '/')
             .replace(/\/+/g, '/');
}

/**
 * 为CDN路径加上前缀
 */
function joinPrefix(prefix, cdnPath) {
  if(!prefix){
    return normalizePath(cdnPath);
  }
  
  return normalizePath(prefix + '/' + cdnPath);
}
    
/**
 * 根据键值对猜出目标资源类型:
 * 资源的类型srcType: js|css|image
 * js:.js
 * css:.css
 * image:.png,.gif,.jpeg,.jpg,.ico,.bmp,.svg
 * 无法猜出资源类型则返回null
 * //cdnUrl后缀->cdnUrl->localUrl
 */
function guessSrcType(localUrl, cdnUrl, separator){
  if(!separator){
    separator = ':';
  }
  var srcType = null;

  //先从cdnUrl后缀判断,只要有后缀，就不会再尝试其他猜测途径
  srcType = getExt(cdnUrl, separator);
  if(srcType){
    return getSrcType(srcType);
  }
  //再从cdnUrl猜测，无法猜出再尝试从localUrl猜测
  srcType = getExtFromUrl(cdnUrl);
  if(getSrcType(srcType)){
    return getSrcType(srcType);
  }
  //最后从localUrl猜测
  srcType = getExtFromUrl(localUrl);
  return getSrcType(srcType);
}//guessSrcType

/**
 * 获得最终的资源类型
 */
function getSrcType(srcType){
  var types = ['js', 'css', 'image'];
  var images = ['png','gif','jpeg','jpg','ico','bmp','svg'];
  if(~types.indexOf(srcType)){
    return srcType;
  }
  if(~images.indexOf(srcType)){
    return 'image';
  }
  return null;
}
/**
 * 从url分析出资源的扩展名
 */
function getExtFromUrl(url){
 url = url.replace(/\?.+$/, '') //clear query
            .replace(/#.+$/, ''); //clear id locator
 return getExt(url, '.');
}
/**
 * 根据给定的分隔符，取得后缀
 */
function getExt(str, separator){
    if(separator){        
        separator = escapeRegExChars(''+separator);
    }
    else {
        separator = '\\.';
    }
    var regex = new RegExp(separator + '(\\w+)$', 'ig');
    var result = regex.exec(str);
    return (result? result[1] : '');
}

/**
 * 去掉cdnUrl中显式指定的SrcType后缀
 * 只有合法的后缀才会去除
 */
function trimSrcTypeAffix(cdnUrl, separator, srcType){
  if(separator){        
    separator = escapeRegExChars(''+separator);
  }
  else {
    separator = ':';
  }
  var srcTypeRe;
  if(srcType){
    srcTypeRe = srcType;
  } else {
    var types = ['js', 'css', 'image'];
    var images = ['png','gif','jpeg','jpg','ico','bmp','svg'];
    srcTypeRe = '('+types.concat(images).join('|')+')';
  }
  var regex = new RegExp(separator + srcTypeRe+'$', 'ig');
  return cdnUrl.replace(regex, '');
}
/**
 * 转义正则表达式的特殊符号
 */
function escapeRegExChars(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('local2cdn', grunt.file.readJSON('package.json').description, function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      maps: null, //Required. Key/value pairs. key:localUrl, value:cdnUrl
      prefix: '', //Optional. Base CDN url
      regex: false, //Optional. Whether key(localUrl) of maps supports RegExp to match or not.
      separator: ':', //Optional. If explicitly specify the type of a resource, append separator and type to the end of value(cdnUrl)
      converter: null //Optional. A function convert the oldUrl to finalUrl. It has 3 parameters:oldUrl, srcType, converter
    });

    if((grunt.util.kindOf(options.maps) !== 'object')
        && (grunt.util.kindOf(options.maps) !== 'array')){
      grunt.fail.warn('Options.maps is required, and must be a plain object or an array of plain objects');      
      return;
    }

    //处理maps
    //[{local: 'xxx', cdn: 'yyy', type:'image'}, ...]
    var mapsArray = [];
    /*
     * options.maps:
     * {
     *   'localUrl1': 'cdnUrl1',
     *   'localUrl2': 'cdnUrl2',
     *   ...
     *   
     *   'localUrln': 'cdnUrln'
     * }
     * //or
     * [
     *   {local: 'localUrl1', cdn: 'cdnUrl1', prefix:'//cdn.a.com', regex:true, srcType:'image', separator:'#$#'},
     *   {local: 'localUrl2', cdn: 'cdnUrl2', prefix:'http://cdn.2.org', regex:true},
     *   {local: 'localUrl3', cdn: 'cdnUrl3', prefix:'http://cdn.3.org'},
     *   ...
     *   {local: 'localUrln', cdn: 'cdnUrln'}
     * ]
     */
    if(grunt.util.kindOf(options.maps) === 'object'){      
      for(var key in options.maps){
        var value = options.maps[key];
        
        var srcType = guessSrcType(key, value, options.separator);
        if(!srcType){
          grunt.log.warn('Cannot get source type of this parirs['+key+':'+value+']. Droped.');              
          continue;
        }
        var localUrl, cdnUrl; 
        if(options.regex){
          localUrl = new RegExp(key, 'ig');
        } else {
          localUrl = new RegExp(escapeRegExChars(key)+'\\s*$', 'ig');
        }

        if(options.prefix){
          cdnUrl = options.prefix + '/' + value;
        } else {
          cdnUrl = value;
        }      
        // Split out protocol first, to avoid '//' getting normalized to '/'
        var bits = cdnUrl.split('//');
        var protocol = bits[0];
        var rest = bits.slice(1).join('/');
        // Join it all together
        cdnUrl = protocol + '//' + normalizePath("" + rest);
        cdnUrl = trimSrcTypeAffix(cdnUrl, options.separator);
        var thisPairs = {
          "type": srcType.toLowerCase(),
          "local": localUrl,
          "cdn": cdnUrl
        };
        mapsArray.push(thisPairs);
      }//for
    } else {//array
      for(var i=0; i<options.maps.length; i++){
        var thisMap = options.maps[i];

        if(grunt.util.kindOf(thisMap.local) !== 'string' 
          || grunt.util.kindOf(thisMap.cdn) !== 'string'){
          grunt.log.warn('local or cdn property missed in this parirs. Droped. ['+JSON.stringify(thisMap)+']');      
          continue;
        }

        var srcType = thisMap.srcType || guessSrcType(thisMap.local, thisMap.cdn, thisMap.separator||options.separator);
        if(!srcType){
          grunt.log.warn('Cannot get source type of this parirs. Droped. ['+JSON.stringify(thisMap)+']');              
          continue;
        }

        var localUrl, cdnUrl, regex, prefix; 
        if(grunt.util.kindOf(thisMap.regex) !== 'undefined'){
          regex = thisMap.regex;
        } else {
          regex = options.regex;
        }
        if(regex){
          localUrl = new RegExp(thisMap.local, 'ig');
        } else {
          localUrl = new RegExp(escapeRegExChars(thisMap.local)+'\\s*$', 'ig');
        }

        if(grunt.util.kindOf(thisMap.prefix) !== 'undefined'){
          prefix = thisMap.prefix;
        } else {
          prefix = options.prefix;
        }        
        if(prefix){
          cdnUrl = prefix + '/' + thisMap.cdn;
        } else {
          cdnUrl = thisMap.cdn;
        }
        // Split out protocol first, to avoid '//' getting normalized to '/'
        var bits = cdnUrl.split('//');
        var protocol = bits[0];
        var rest = bits.slice(1).join('/');
        // Join it all together
        cdnUrl = protocol + '//' + normalizePath("" + rest);
        //如果显式指定了srcType属性，则不再截除
        if(!thisMap.srcType){
          cdnUrl = trimSrcTypeAffix(cdnUrl, thisMap.separator||options.separator);
        }
        var thisPairs = {
          "type": srcType.toLowerCase(),
          "local": localUrl,
          "cdn": cdnUrl
        };
        mapsArray.push(thisPairs);
      }//for
    }
    /*
    console.log('mapsArray:');
    console.log(mapsArray);
    console.log('===================');*/

    //default function for converting oldUrl to finalUrl
    var converterURL = function(oldUrl, srcType){
      if(!isLocalPath(oldUrl)){//不是本地路径，不予转换
        return oldUrl;
      }

      for(var i=0; i<mapsArray.length; i++){
        var thisMap = mapsArray[i];

        if(thisMap.type !== srcType.toLowerCase()){
          continue;
        }
        //用test，同样的oldUrl和local, 
        //结果会出现true和false交替出现的情况，why？
        //var found = thisMap.local.test(oldUrl);
        var found = ~oldUrl.search(thisMap.local);
        if(!found){
          continue;
        } else {          
          return thisMap.cdn;
        }
      }//for

      return oldUrl;
    };//converterURL

    //function for convert oldUrl to finalUrl
    var converter;
    if(!options.converter){
      converter = converterURL;
    } else if(grunt.util.kindOf(options.converter) !== 'function') {
      grunt.log.warn('Options.converter must be a function. Default converter will be used.');
      converter = converterURL;
    } else {
      converter = options.converter;
    }

    var converterImgURL = function(oldUrl){
      return converter(oldUrl, 'image', converterURL);
    }
    var converterJsURL = function(oldUrl){
      return converter(oldUrl, 'js', converterURL);
    }
    var converterCssURL = function(oldUrl){
      return converter(oldUrl, 'css', converterURL);
    }

    // Iterate over all specified file groups.
    this.files.forEach(function(file) {
      //file is the final src/dest pairs. 
      //file has only one dest, but may have more than one src
      
      //file.src is an array of files
      var srcFiles = file.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      });
      if (srcFiles.length === 0){
        grunt.log.warn('No valid source file found.');
        return;
      }
      if (srcFiles.length > 1) {
        grunt.log.warn('Multiple source files supplied for single destination; only the first will be used.');
      }

      //final srcFile and destFile
      var srcFile = srcFiles[0],
         destFile = file.dest;

      // It's a CSS file, update the image URLs in it.
      if (/.css$/.test(srcFile)) {
        var oldCSS = grunt.file.read(srcFile),
            newCSS = rewriteCSSURLs(oldCSS, converterImgURL);

        grunt.file.write(destFile, newCSS);
        grunt.log.ok("Wrote CSS file: \"" + destFile + "\"");
      }
      else {
        // It's an HTML file.
        var oldHTML = grunt.file.read(srcFile),
            soup = new Soup(oldHTML);

        // Update script URLs
        soup.setAttribute('script[src]', 'src', converterJsURL);

        // Update stylesheet URLs
        soup.setAttribute('link[rel=stylesheet]', 'href', converterCssURL);

        // Update image URLs
        soup.setAttribute('img[src]', 'src', converterImgURL);

        // Update image URLs in any embedded stylesheets
        soup.setInnerHTML('style', function (css) {
          return rewriteCSSURLs(css, converterImgURL);
        });

        // Write it to disk
        grunt.file.write(destFile, soup.toString());
        grunt.log.ok("Wrote HTML file: \"" + destFile + "\"");
      }
    });//this.files.forEach
  });//grunt.registerMultiTask
};//module.exports
