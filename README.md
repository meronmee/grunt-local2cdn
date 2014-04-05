# grunt-local2cdn

> A Grunt plugin to convert local URLs to CDN ones in html files(or the like, e.g. .ejs,.jsp,.jade).

> It gets some inspiration from [grunt-cdnify](https://github.com/callumlocke/grunt-cdnify)(by @callumlocke)

# What it does

The task looks through your specified files for URLs to modify, in the following places:

- `<img src="____">`
- `<script src="____"></script>`
- `<link rel="stylesheet" href="____">`
- `background-image: url(____); in your CSS (including inside <style> tags in your HTML)`

It will ignore web urls and image in data URI format, e.g. `http://www.example.com/foo.png`, `data:image/png;base64,iVBORw0KGgoAAAANS...` 

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-local2cdn --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-local2cdn');
```

## The "local2cdn" task

### Overview
In your project's Gruntfile, add a section named `local2cdn` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  local2cdn: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.prefix
Type: `[Optional]String`
Default value: `''`


The base url of CDN, e.g. `http://cdn.bootcss.com`. It will prepend to all the CDN urls in `options.maps`. For some special urls, you can overwrite it, see `options.maps` bellow.

#### options.maps
Type: `[Required] Object|Array of Objects`
Default value: `null`

It defines the maps of local urls and cdn urls. You must specify it youself.

It supports two formats:

**Simple format:**

An object constituted by key/value maps, the key is the local url, and the value is the CDN url. 

```js
{
    'jquery.js': 'jquery/2.0.3/jquery.min.js',
    'bootstrap.js': 'bootstrap/3.1.1/js/bootstrap.min.js',
    'bootstrap.css': '/bootstrap/3.1.1/css/bootstrap.min.css',
    'foo.png': '/xxx/foo.png',
    'foo.jpg': '/xxx/foo.jpg',
    'foo.gif': '/xxx/foo.gif',
    'foo.tif': '/xxx/foo.tif:image'
}
```

**Advanced format:**

An array constituted by objects. You can overwrite some options(`prefix, regex, separator`) in each object. `local` and `cdn` properties are required, `prefix`, `regex`, `separator`, `srcType` properties are optional.

```js
[
   {local: 'jquery.js', cdn: 'jquery/2.0.3/jquery.min.js', prefix:'//cdn.a.com', regex:true, srcType:'image'},
   {local: 'bootstrap.js', cdn: 'bootstrap/3.1.1/js/bootstrap.min.js', prefix:'http://cdn.2.org', regex:true},
   {local: 'bootstrap.css', cdn: '/bootstrap/3.1.1/css/bootstrap.min.css'},
   {local: 'foo.png', cdn: '/xxx/foo.png', prefix:'http://cdn.3.org'},
   {local: 'foo.jpg', cdn: '/xxx/foo.jpg'},
   {local: 'foo.gif', cdn: '/xxx/foo.gif'},
   {local: 'foo.tif', cdn: '/xxx/foo.tif', srcType:'image'},
   {local: '^aabbcc', cdn: '/xxx/foo.pic?123#$#image', separator:'#$#',  regex:true}
]
```

#### options.regex
Type: `[Optional]Boolean`
Default value: `false`

Whether local url in `options.maps` supports RegExp or not.
If `true`, the final RegExp used to match will be `new RegExp(localUrl, 'ig')`;
If `false`, the final RegExp used to match will be `new RegExp(escapeRegExChars(localUrl)+'\\s*$', 'ig')`;

It can be overwrote in `options.maps`.

#### options.separator
Type: `[Optional]String`
Default value: `':'`

This plugin needs to know the source type`(image,css,js)` of each url. It will guess the source type from local url or CDN url by the source file extension. e.g.: 

`'jquery.js': 'jquery/2.0.3/jquery.min.js'` --> srcType will be 'js';

`'bootstrap.css': '/bootstrap/3.1.1/css/bootstrap.min.css'`  --> srcType will be 'css';

`'foo.png': '/xxx/foo.png'` --> srcType will be 'image', the supported image types are:`'png','gif','jpeg','jpg','ico','bmp','svg'`

If the map is: `'foo.tif': '/xxx/foo.tif'`, this plugin cannot guess out the source type, and then you need to explicitly specify the source type of this  resource, append separator and type to the end of CDN url, that is `'foo.tif': '/xxx/foo.tif:image'`, it will works as an image url.

It can be overwrote in `options.maps`.

#### options.converter
Type: `[Optional]Function`
Default value: `A built-in function`

A function convert the oldUrl(local url) to finalUrl(usually is a cdn url). It must return a string. And it has three parameters:`oldUrl`, `srcType`, `converter`. The first parameter `oldUrl` is the origin url of the current resource; The second parameter `srcType` is the source type of the current resource, it is a string value of `image|js|css`; The third parameter `converter` is the built-in convert function.

If ignore, the built-in convert function will be used.

e.g.:
```js
...
options: {
  ...
  converter: function(oldUrl, srcType, converterURL){
    if(oldUrl.indexOf('data:') === 0)
      return url; // leave data URIs untouched
    else if(oldUrl.indexOf('http') === 0)
      return url + '?12345'; // add query string to all other URLs
    else 
      return converterURL(oldUrl, srcType);
  }
  ...
}
...
```


### Usage Examples

#### Example 1
In this example, references contain strings in `options.form` in the src file `'test/src/formated.html'` will be replaced by `options.to: 'libs/libs.css(merged with options.prefix)'`, and the result will be saved to `dest:'test/dist/formated.html'`.

```js
grunt.initConfig({
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
        }
      },
      files: [
        {
          expand: true,
          cwd: 'test/src',
          src: '**/*.{css,html,ejs}',
          dest: 'test/dist'
        }
      ]
    }//eof:local2cdn:main target
  }//eof:local2cdn task
});

```
The src file `test/src/sample.html` maybe like:
```html
<html>
  <head>
    <style>
      body {
        background-image: url('foo.jpg');
        background-image: url("foo.jpg");
        background-image: url(foo.jpg);
        background-image: url('/foo.png');
        background-image: url('bar/foo.png');        
        background-image: url('http://demo.com/bar/foo.png');
        background-image: url('../foo.gif');
        background-image: url('foo/bar.jpg');
        background-image: url('data:gif; base64XQTRTWEQW');
      }
    </style>
    <!-- Bootstrap Core-->
    <link href="/libs/bootstrap/css/bootstrap.css" rel="stylesheet">
  </head>  
  <body>
    <img something src="foo.jpg" data-cc data-dd="1111">
    <img src=foo/bar.png so="what" />
    <img src="/foo.gif" something=xxx  >
    <img src="http://demo.com/bar/foo.png" something=aaa  >
    <img src="bar/foo.png" something=yyy  >    
    <img src="bar/foo.tif" />
    <!-- jquery.js -->
    <script src="/libs/jquery.js"></script>
    <script src="/libs/bootstrap/js/bootstrap.js"></script>
  </body>
</html>
 ...
```
and the dest file `'test/dist/sample.html'` will like:
```html
<html>
  <head>
    <style>
      body {
        background-image: url('http://cdn.bootcss.com/xxx/foo.jpg');
        background-image: url("http://cdn.bootcss.com/xxx/foo.jpg");
        background-image: url(http://cdn.bootcss.com/xxx/foo.jpg);
        background-image: url('http://cdn.bootcss.com/xxx/foo.png');
        background-image: url('http://cdn.bootcss.com/xxx/foo.png');        
        background-image: url('http://demo.com/bar/foo.png');
        background-image: url('http://cdn.bootcss.com/xxx/foo.gif');
        background-image: url('foo/bar.jpg');
        background-image: url('data:gif; base64XQTRTWEQW');
      }
    </style>
    <!-- Bootstrap Core-->
    <link href="http://cdn.bootcss.com/bootstrap/3.1.1/css/bootstrap.min.css" rel="stylesheet">
  </head>  
  <body>
    <img something src="http://cdn.bootcss.com/xxx/foo.jpg" data-cc data-dd="1111">
    <img src=foo/bar.png so="what" />
    <img src="http://cdn.bootcss.com/xxx/foo.gif" something=xxx  >
    <img src="http://demo.com/bar/foo.png" something=aaa  >
    <img src="http://cdn.bootcss.com/xxx/foo.png" something=yyy  >    
    <img src="http://cdn.bootcss.com/xxx/foo.tif" />
    <!-- jquery.js -->
    <script src="http://cdn.bootcss.com/jquery/2.0.3/jquery.min.js"></script>
    <script src="http://cdn.bootcss.com/bootstrap/3.1.1/js/bootstrap.min.js"></script>
  </body>
</html>
```

## Hot CDNs:
**China**
- Bootstrap 中文站:[http://cdn.bootcss.com](http://cdn.bootcss.com)
- Baidu: [http://developer.baidu.com/wiki/index.php?title=docs/cplat/libs](http://developer.baidu.com/wiki/index.php?title=docs/cplat/libs)
- 又拍云: [http://jscdn.upai.com](http://jscdn.upai.com)
- 七牛云: [http://www.staticfile.org/](http://www.staticfile.org/)
- 新浪: [http://lib.sinaapp.com](http://lib.sinaapp.com)

**International**
- Google: [https://developers.google.com/speed/libraries/devguide](https://developers.google.com/speed/libraries/devguide)
- cdnjs (powered by CloudFlare):[http://cdnjs.com](http://cdnjs.com)
- jsdelivr: [http://www.jsdelivr.com/](http://www.jsdelivr.com/)

## Release History
* 2014-04-05    v0.1.0
