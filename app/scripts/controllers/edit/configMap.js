'use strict';

/**
 * @ngdoc function
 * @name openshiftConsole.controller:EditConfigMapController
 * @description
 * # EditConfigMapController
 * Controller of the openshiftConsole
 */
angular.module('openshiftConsole')
  .controller('EditConfigMapController',
              function ($filter,
                        $routeParams,
                        $scope,
                        $window,
                        APIService,
                        DataService,
                        BreadcrumbsService,
                        Navigate,
                        NotificationsService,
                        ProjectsService) {
    var watches = [];
    $scope.forms = {};
    $scope.projectName = $routeParams.project;

    $scope.breadcrumbs = BreadcrumbsService.getBreadcrumbs({
      name: $routeParams.configMap,
      kind: 'ConfigMap',
      namespace: $routeParams.project,
<<<<<<< HEAD
      subpage: 'Edit Config Map'
=======
      subpage: '编辑配置映射'
>>>>>>> 94fb08e7f06e2d1ad2b99b3cc6ae23330217009b
    });

    var getVersion = function(resource) {
      return _.get(resource, 'metadata.resourceVersion');
    };

    var hideErrorNotifications = function() {
      NotificationsService.hideNotification("edit-config-map-error");
    };

    var navigateBack = function() {
      $window.history.back();
    };
    $scope.cancel = navigateBack;

    var configMapsVersion = APIService.getPreferredVersion('configmaps');

    ProjectsService
      .get($routeParams.project)
      .then(_.spread(function(project, context) {
        DataService
          .get(configMapsVersion, $routeParams.configMap, context, { errorNotification: false })
          .then(function(configMap) {
            $scope.loaded = true;
            $scope.breadcrumbs = BreadcrumbsService.getBreadcrumbs({
              name: $routeParams.configMap,
              object: configMap,
              project: project,
<<<<<<< HEAD
              subpage: 'Edit Config Map'
=======
              subpage: '编辑配置映射'
>>>>>>> 94fb08e7f06e2d1ad2b99b3cc6ae23330217009b
            });
            $scope.configMap = configMap;
            watches.push(DataService.watchObject(configMapsVersion, $routeParams.configMap, context, function(newValue, action) {
              $scope.resourceChanged = getVersion(newValue) !== getVersion($scope.configMap);
              $scope.resourceDeleted = action === "DELETED";
            }));
          }, function(e) {
<<<<<<< HEAD
            Navigate.toErrorPage("Could not load config map " + $routeParams.configMap + ". " +
=======
            Navigate.toErrorPage("无法加载配置映射 " + $routeParams.configMap + ". " +
>>>>>>> 94fb08e7f06e2d1ad2b99b3cc6ae23330217009b
                                 $filter('getErrorDetails')(e));
          });

        $scope.updateConfigMap = function() {
          if ($scope.forms.editConfigMapForm.$valid) {
            hideErrorNotifications();
            $scope.disableInputs = true;

            DataService.update(configMapsVersion, $scope.configMap.metadata.name, $scope.configMap, context)
              .then(function() { // Success
                NotificationsService.addNotification({
                  type: "success",
<<<<<<< HEAD
                  message: "Config map " + $scope.configMap.metadata.name + " successfully updated."
=======
                  message: "配置映射 " + $scope.configMap.metadata.name + " 更新成功。"
>>>>>>> 94fb08e7f06e2d1ad2b99b3cc6ae23330217009b
                });
                navigateBack();
              }, function(result) { // Failure
                $scope.disableInputs = false;
                NotificationsService.addNotification({
                  id: "edit-config-map-error",
                  type: "error",
<<<<<<< HEAD
                  message: "An error occurred updating the config map.",
=======
                  message: "更新配置映射时出错。",
>>>>>>> 94fb08e7f06e2d1ad2b99b3cc6ae23330217009b
                  details: $filter('getErrorDetails')(result)
                });
              });
          }
        };

        $scope.$on('$destroy', function(){
          DataService.unwatchAll(watches);
          hideErrorNotifications();
        });
    }));
  });
