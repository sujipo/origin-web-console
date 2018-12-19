'use strict';

/**
 * @ngdoc function
 * @name openshiftConsole.controller:EditHealthChecksController
 * @description
 * # EditHealthChecksController
 * Controller of the openshiftConsole
 */
angular.module('openshiftConsole')
  .controller('EditHealthChecksController',
              function ($filter,
                        $location,
                        $routeParams,
                        $scope,
                        AuthorizationService,
                        BreadcrumbsService,
                        APIService,
                        DataService,
                        Navigate,
                        NotificationsService,
                        ProjectsService) {
    if (!$routeParams.kind || !$routeParams.name) {
      Navigate.toErrorPage("类型或名称参数丢失。");
      return;
    }

    var supportedKinds = [
      'Deployment',
      'DeploymentConfig',
      'ReplicaSet',
      'ReplicationController'
    ];

    if (!_.includes(supportedKinds, $routeParams.kind)) {
      Navigate.toErrorPage("健康检查不支持类别 " + $routeParams.kind + "。");
      return;
    }

    $scope.name = $routeParams.name;
    $scope.resourceURL = Navigate.resourceURL($scope.name, $routeParams.kind, $routeParams.project);

    $scope.breadcrumbs = BreadcrumbsService.getBreadcrumbs({
      name: $routeParams.name,
      kind: $routeParams.kind,
      namespace: $routeParams.project,
      subpage: '编辑健康检查'
    });

    // Map of removed probes so that removing and adding back a probe remembers what was previously set.
    $scope.previousProbes = {};

    var getErrorDetails = $filter('getErrorDetails');
    var upperFirst = $filter('upperFirst');

    var displayError = function(errorMessage, errorDetails) {
      NotificationsService.addNotification({
        id: "add-health-check-error",
        type: "error",
        message: errorMessage,
        details: errorDetails
      });
    };

    var navigateBack = function() {
      $location.url($scope.resourceURL);
    };
    $scope.cancel = navigateBack;

    var hideErrorNotifications = function() {
      NotificationsService.hideNotification("add-health-check-error");
    };
    $scope.$on('$destroy', hideErrorNotifications);

    ProjectsService
      .get($routeParams.project)
      .then(_.spread(function(project, context) {
        var displayName = $filter('humanizeKind')($routeParams.kind) + ' "' + $scope.name + '"';
        var resourceGroupVersion = {
          resource: APIService.kindToResource($routeParams.kind),
          group: $routeParams.group
        };

        if (!AuthorizationService.canI(resourceGroupVersion, 'update', $routeParams.project)) {
          Navigate.toErrorPage('你没有权限更新 ' + displayName + '.', 'access_denied');
          return;
        }

        DataService.get(resourceGroupVersion, $scope.name, context).then(
          function(result) {
            // Modify a copy of the object.
            var object = $scope.object = angular.copy(result);
            $scope.breadcrumbs = BreadcrumbsService.getBreadcrumbs({
              object: object,
              project: project,
              subpage: '修改健康检查'
            });

            $scope.containers = _.get(object, 'spec.template.spec.containers');

            $scope.addProbe = function(container, probe) {
              // Restore the previous values if set.
              container[probe] = _.get($scope.previousProbes, [container.name, probe], {});
              $scope.form.$setDirty();
            };

            $scope.removeProbe = function(container, probe) {
              // Remember previous values if the probe is added back.
              _.set($scope.previousProbes, [container.name, probe], container[probe]);
              delete container[probe];
              $scope.form.$setDirty();
            };

            $scope.save = function() {
              $scope.disableInputs = true;
              hideErrorNotifications();
              DataService.update(APIService.kindToResource($routeParams.kind),
                                 $scope.name,
                                 object,
                                 context).then(
                function() {
                  NotificationsService.addNotification({
                      type: "success",
                      message: upperFirst(displayName) + " 已经更新。"
                  });
                  navigateBack();
                },
                function(result) {
                  $scope.disableInputs = false;
                  displayError(upperFirst(displayName) + ' 无法更新。', getErrorDetails(result));
                });
            };
          },
          function(result) {
            displayError(upperFirst(displayName) + ' 无法加载。', getErrorDetails(result));
          }
        );
    }));
  });
