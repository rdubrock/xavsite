var franSite = angular.module('franSite', ['ngSanitize'])

.controller('UserController', ['UserService', '$http', '$sce', function(UserService, $http, $sce){
  

  var self = this;

  var postNumber=0;
  function getCookie() {
    var cookies = document.cookie.split(';')
    var names = cookies.split('=')
    console.log(names);
  }
  var docCookies = {
    getItem: function (sKey) {
      if (!sKey) { return null; }
      return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
      if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
      var sExpires = "";
      if (vEnd) {
        switch (vEnd.constructor) {
          case Number:
            sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
            break;
          case String:
            sExpires = "; expires=" + vEnd;
            break;
          case Date:
            sExpires = "; expires=" + vEnd.toUTCString();
            break;
        }
      }
      document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
      return true;
    },
    removeItem: function (sKey, sPath, sDomain) {
      if (!this.hasItem(sKey)) { return false; }
      document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
      return true;
    },
    hasItem: function (sKey) {
      if (!sKey) { return false; }
      return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    },
    keys: function () {
      var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
      for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
      return aKeys;
    }
  };
  if(docCookies.getItem('token')){
    $http.post('/authenticate').
    success(function(data, status, headers, config) {
      self.loggedIn = true;
      $http.post('/uploads').
        success(function(data, status, headers, config) {
          var images = data.split(",");
            for (var i = 0; i < images.length; i++) {
              if(images[i] !='.DS_Store' && images[i]!='.gitignore') {
                UserService.images.push(images[i]);  
              }
            };
            $http.get('/posts').
              success(function(data, status, headers, config) {
                self.posts = data;
                if (self.posts.length > 5) {
                  self.nextButton = true;  
                } else {
                  self.nextButton = false;
                }
              }).error(function(data, status, headers, config){
                console.log(data);
              });
        }).
        error(function(data, status, headers, config) {
          console.log(status + " " + data);
        });

    }).
    error(function(data, status, headers, config) {
      console.log(data);
    });
  } else {
    $http.get('/posts').
    success(function(data, status, headers, config) {
      self.posts = data;
      if (self.posts.length > 5) {
        self.nextButton = true;  
      } else {
        self.nextButton = false;
      }
    }).error(function(data, status, headers, config){
      console.log(data);
    });
  }

  this.editor = true;

  this.toggleEditor = function(){
    this.editor = !this.editor;
  }

  this.postUpdate = false;

  this.showPostUpdate = function(text) {
    this.postUpdate = !this.postUpdate;
    this.updatedText = text;
  }

  this.videoTutorial = false;

  this.videoExplain = function() {
    this.videoTutorial = !this.videoTutorial;
  }

  this.textTutorial = false;

  this.htmlExplain = function() {
    this.textTutorial = !this.textTutorial;
  }

  this.save = function(){
    var images = [];
    var title;
    var body;
    var author;

    if (this.firstImage) {
      images.push('<img src="images/blogpost/' + this.firstImage + '">');
    };
    if (this.secondImage) {
      images.push('<img src="images/blogpost/' + this.secondImage + '">');
    };
    if (this.thirdImage) {
      images.push('<img src="images/blogpost/' + this.thirdImage + '">');
    };
    if (this.fourthImage) {
      images.push('<img src="images/blogpost/' + this.fourthImage + '">');
    };
    if (this.fifthImage) {
      images.push('<img src="images/blogpost/' + this.fifthImage + '">');
    };
    if (this.sixthImage) {
      images.push('<img src="images/blogpost/' + this.sixthImage + '">');
    };
    if(this.body) {
      body = '<p>' + this.body + '<p>';
    }

    if(this.video) {
      var video = this.video;
    }

    if(this.author) {
      var author = this.author;
    }

    $http.post('/blogsave', {images: images, video: video, title: title, body: body, author: author}).
    success(function(data, status, headers, config) {
      window.location.reload();
    }).
    error(function(data, status, headers, config) {
      console.log('save failed');
    });
  }
  this.logOut = function(){
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    this.loggedIn = false;
  }

  this.images = UserService.images;

  this.loggedIn = false;

  this.posts; 

  this.nextButton;

  this.currentPage = 0;  

  this.itemsLimit = 5;

  this.postsPaginated = function () {
      var currentPageIndex = this.currentPage * this.itemsLimit;
      if(this.posts){
        if (currentPageIndex >= this.posts.length-5) {
          this.nextButton = false;
        }
        return this.posts.slice(
          currentPageIndex, 
          currentPageIndex + this.itemsLimit);
      }
  };

  this.nextPosts = function(){
    this.currentPage++;
  }

  this.prevPosts = function(){
    this.currentPage--;
    this.nextButton=true;
  }

  this.updateText = function(id) {
    $http.post('/blogupdate', {id: id, text: this.updatedText}).
    success(function(data, status, headers, config) {
      window.location.reload();
    }).
    error(function(data, status, headers, config) {
      console.log(data);
    });
  };

  this.delete = function(post){
    $http.post('/blogdelete', {id: post._id}).
    success(function(data, status, headers, config) {
      console.log(data);
      window.location.reload();
    }).
    error(function(data, status, headers, config) {
      console.log(data);
    });
  }
  
}])

.controller('UploadController', ['$scope', 'fileUpload', function($scope, fileUpload){
    
    $scope.uploadFile = function(){
        var file = $scope.myFile;
        console.log('file is ' + JSON.stringify(file));
        var uploadUrl = '/imageupload';
        fileUpload.uploadFileToUrl(file, uploadUrl);
    };
    
}])

.directive('fileModel', ['$parse', function ($parse) {
  return {
      restrict: 'A',
      link: function(scope, element, attrs) {
          var model = $parse(attrs.fileModel);
          var modelSetter = model.assign;
          
          element.bind('change', function(){
              scope.$apply(function(){
                  modelSetter(scope, element[0].files[0]);
              });
          });
      }
  };
}])

.service('UserService', function() {
  this.images = [];
})

.service('fileUpload', ['$http', 'UserService', function ($http, UserService) {
    this.uploadFileToUrl = function(file, uploadUrl){
        var fd = new FormData();
        fd.append('file', file);
        $http.post(uploadUrl, fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        })
        .success(function(){
          $http.post('/uploads').
          success(function(data, status, headers, config) {
            var images = data.split(",");
            UserService.images.splice(0, 100)
            for (var i = 0; i < images.length; i++) {
              if(images[i] !='.DS_Store' && images[i]!='.gitignore') {
                UserService.images.push(images[i]);  
              }
            };
          })
          .error(function(data, status, headers, config){
            console.log(data)
          });
        })
        .error(function(data, status, headers, config){
          console.log(data)
        });
    }
}])

.filter('toHtml', function ($sce) {
    return function (value) {
      return $sce.trustAsHtml(value);
    };
})

.config(function($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    'self',
    'https://vimeo.com/**'
  ]);
});
