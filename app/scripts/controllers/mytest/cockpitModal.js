'use strict';

angular.module('openshiftConsole')
  .controller('CockpitModalController', function ($scope, $location) {
    $scope.txt1 = '测试文本111111';

    $scope.url = $location.absUrl();
  });
