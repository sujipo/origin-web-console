'use strict';

angular.module("openshiftConsole")
  .factory("DockerfileService", function($http, $q, $rootScope) {


    var query = function(url) {

      alert(url);
      return $http.get(url).then(function(response) {
        var result = response.data;

        return result;
      });
    };

  });
