var franSite = angular.module('franSite', ['ngFileUpload'])

.controller('UserController', ['UserService', '$http', function(UserService, $http){
  var self = this;

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

  this.images = UserService.images;

  this.loggedIn = false;

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
        }).
        error(function(data, status, headers, config) {
          console.log(status);
        });

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
                  file: file
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
});

