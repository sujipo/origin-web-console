'use strict';

angular.module('openshiftConsole')
  .controller('MytestModalController', function ($scope, $location) {
    $scope.txt1 = '测试文本111111';
    $scope.txt2 = '测试文本222222222222';
    $scope.txt3 = '测试文本33333333333333333';
    $scope.url = $location.absUrl();
  });
