'use strict';

angular.module('openshiftConsole')
  .controller('MytestModalController', function ($scope, $location) {
    $scope.txt1 = '测试文本111111';
    $scope.txt2 = '测试文本222222222222';
    $scope.txt3 = '测试文本33333333333333333';
    $scope.url = $location.absUrl();

    
    $scope.dockerfiles = [{'Name':'test1','Desc':'描述1','Content':'From test1......','Created':'2019-01-01 00:11:22'}];
    $scope.size = $scope.dockerfiles.size;
  });
