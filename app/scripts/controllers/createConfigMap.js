'use strict';

/**
 * @ngdoc function
 * @name openshiftConsole.controller:CreateConfigMapController
 * @description
 * # CreateConfigMapController
 * Controller of the openshiftConsole
 */
angular.module('openshiftConsole')
  .controller('CreateConfigMapController',
              function ($filter,
                        $routeParams,
                        $scope,
                        $window,
                        APIService,
                        AuthorizationService,
                        DataService,
                        Navigate,
                        NotificationsService,
                        ProjectsService) {
    $scope.projectName = $routeParams.project;

    // TODO: Update BreadcrumbsService to handle create pages.
    $scope.breadcrumbs = [
      {
         title: "配置映射",
         link: "project/" + $scope.projectName + "/browse/config-maps"
      },
      {
        title: "创建配置映射"
      }
    ];

    var hideErrorNotifications = function() {
      NotificationsService.hideNotification("create-config-map-error");
    };
    $scope.$on('$destroy', hideErrorNotifications);

    var navigateBack = function() {
      $window.history.back();
    };
    $scope.cancel = navigateBack;

    ProjectsService
      .get($routeParams.project)
      .then(_.spread(function(project, context) {
        $scope.project = project;

        if (!AuthorizationService.canI('configmaps', 'create', $routeParams.project)) {
          Navigate.toErrorPage('您没有权限在 ' + $routeParams.project + '.', '项目中创建配置映射。');
          return;
        }

        $scope.configMap = {
          apiVersion: 'v1',
          kind: 'ConfigMap',
          metadata: {
            namespace: $routeParams.project
          },
          data: {}
        };

        $scope.createConfigMap = function() {
          if ($scope.createConfigMapForm.$valid) {
            hideErrorNotifications();
            $scope.disableInputs = true;
            var createConfigMapVersion = APIService.objectToResourceGroupVersion($scope.configMap);
            DataService.create(createConfigMapVersion, null, $scope.configMap, context)
              .then(function() { // Success
                NotificationsService.addNotification({
                  type: "success",
                  message: "配置映射 " + $scope.configMap.metadata.name + " 创建成功。"
                });
                // Return to the previous page.
                navigateBack();
              }, function(result) { // Failure
                $scope.disableInputs = false;
                NotificationsService.addNotification({
                  id: "create-config-map-error",
                  type: "error",
                  message: "创建配置映射时出错。",
                  details: $filter('getErrorDetails')(result)
                });
              });
          }
        };
    }));
  });
