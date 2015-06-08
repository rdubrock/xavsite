var franSite = angular.module('franSite', ['ngFileUpload', 'ngSanitize'])

.controller('UserController', ['UserService', '$http', '$sce', function(UserService, $http, $sce){
  var self = this;

  var postNumber=0;

  if(document.cookie){
    $http.post('/authenticate').
    success(function(data, status, headers, config) {
      self.loggedIn = true;
      $http.post('/uploads').
        success(function(data, status, headers, config) {
          var images = data.split(",");
            images.shift();
            for (var i = 0; i < images.length; i++) {
              UserService.images.push(images[i]);
            };
            $http.get('/posts').
              success(function(data, status, headers, config) {
                self.posts = data;
              }).error(function(data, status, headers, config){
                console.log(data);
              });
        }).
        error(function(data, status, headers, config) {
          console.log(status);
        });

    }).
    error(function(data, status, headers, config) {
      console.log(data);
    });
  } else {
    $http.get('/posts').
    success(function(data, status, headers, config) {
      self.posts = data;
      postNumber++;
    }).error(function(data, status, headers, config){
      console.log(data);
    });
  }

  this.deleteImages = function(){
     UserService.images.splice(0, 100);
     $http.post('/deleteimages').
     success(function(data, status, headers, config) {
      console.log('deleted');
     }).
     error(function(data, status, headers, config) {
      console.log(status);
     })
  }

  this.editor = true;

  this.toggleEditor = function(){
    this.editor = !this.editor;
  }

  this.postUpdate = false;

  this.showPostUpdate = function() {
    this.postUpdate = !this.postUpdate;
  }

  this.save = function(){
    var images = [];
    var title;
    var body;

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
    $http.post('/blogsave', {images: images, title: title, body: body}).
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

  this.updatePreview = function(html) {
    this.previewText = html;
  }

  this.previewText;

  this.delete = function(post){
    $http.post('/blogdelete', {id: post._id}).
    success(function(data, status, headers, config) {
      window.location.reload();
    }).
    error(function(data, status, headers, config) {
      console.log(data);
    });
  }
  
}])

.controller('UploadController', ['$scope', 'Upload', 'UserService', function ($scope, Upload, UserService) {
  
  $scope.$watch('files', function () {
      $scope.upload($scope.files);
  });
  $scope.log = '';

  $scope.upload = function (files) {
      if (files && files.length) {
          for (var i = 0; i < files.length; i++) {
              var file = files[i];
              Upload.upload({
                  url: '/uploads',
                  file: file,
                  data: file.name
              }).progress(function (evt) {
                  var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                  $scope.log = 'progress: ' + progressPercentage + '% ' +
                              evt.config.file.name + '\n' + $scope.log;
              }).success(function (data, status, headers, config) {
                  var images = data.split(",");
                  UserService.images.splice(0, 10);
                  for (var i = 0; i < images.length; i++) {
                    UserService.images.push(images[i]);
                  };
              });
          }
      }
  };
}])

.service('UserService', function() {
  this.images = [];
})

.filter('toHtml', function ($sce) {
    return function (value) {
      return $sce.trustAsHtml(value);
    };
});

