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
         title: "Secrets",
         link: "project/" + $scope.projectName + "/browse/secrets"
      },
      {
        title: "Create Secret"
      }
    ];

    ProjectsService
      .get($routeParams.project)
      .then(_.spread(function(project, context) {
        $scope.project = project;
        $scope.context = context;

        if (!AuthorizationService.canI('secrets', 'create', $routeParams.project)) {
          Navigate.toErrorPage('您没有权限在项目' + $routeParams.project + '中创建私密。', 'access_denied');
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
