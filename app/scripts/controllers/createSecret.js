'use strict';

/**
 * @ngdoc function
 * @name openshiftConsole.controller:CreateSecretController
 * @description
 * # CreateSecretController
 * Controller of the openshiftConsole
 */
angular.module('openshiftConsole')
  .controller('CreateSecretController',
              function($filter,
                       $location,
                       $routeParams,
                       $scope,
                       $window,
                       ApplicationGenerator,
                       AuthorizationService,
                       DataService,
                       Navigate,
                       ProjectsService) {
    $scope.alerts = {};
    $scope.projectName = $routeParams.project;

    $scope.breadcrumbs = [
      {
<<<<<<< HEAD
         title: "密钥",
         link: "project/" + $scope.projectName + "/browse/secrets"
      },
      {
        title: "创建密钥"
=======
         title: "Secrets",
         link: "project/" + $scope.projectName + "/browse/secrets"
      },
      {
        title: "Create Secret"
>>>>>>> 94fb08e7f06e2d1ad2b99b3cc6ae23330217009b
      }
    ];

    ProjectsService
      .get($routeParams.project)
      .then(_.spread(function(project, context) {
        $scope.project = project;
        $scope.context = context;

        if (!AuthorizationService.canI('secrets', 'create', $routeParams.project)) {
          Navigate.toErrorPage('You do not have authority to create secrets in project ' + $routeParams.project + '.', 'access_denied');
          return;
        }

        $scope.navigateBack = function() {
          if ($routeParams.then) {
            $location.url($routeParams.then);
            return;
          }

          $window.history.back();
        };
    }));
  });
