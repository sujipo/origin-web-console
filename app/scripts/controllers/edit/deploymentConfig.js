'use strict';

/**
 * @ngdoc function
 * @name openshiftConsole.controller:EditDeploymentConfigController
 * @description
 * Controller of the openshiftConsole
 */
angular.module('openshiftConsole')
  .controller('EditDeploymentConfigController',
              function($scope,
                       $filter,
                       $location,
                       $routeParams,
                       $uibModal,
                       $window,
                       APIService,
                       AuthorizationService,
                       BreadcrumbsService,
                       DataService,
                       EnvironmentService,
                       Navigate,
                       NotificationsService,
                       ProjectsService,
                       SecretsService,
                       keyValueEditorUtils) {
    $scope.projectName = $routeParams.project;
    $scope.deploymentConfig = null;
    $scope.alerts = {};
    $scope.view = {
      advancedStrategyOptions: false,
      advancedImageOptions: false
    };
    $scope.triggers = {};
    $scope.breadcrumbs = BreadcrumbsService.getBreadcrumbs({
      name: $routeParams.name,
      kind: $routeParams.kind,
      namespace: $routeParams.project,
      subpage: '修改部署配置'
    });

    $scope.deploymentConfigStrategyTypes = [
      "Recreate",
      "Rolling",
      "Custom"
    ];

    var orderByDisplayName = $filter('orderByDisplayName');
    var getErrorDetails = $filter('getErrorDetails');

    var displayError = function(errorMessage, errorDetails) {
      $scope.alerts['from-value-objects'] = {
        type: "error",
        message: errorMessage,
        details: errorDetails
      };
    };

    var deploymentConfigsVersion = APIService.getPreferredVersion('deploymentconfigs');
    var configMapsVersion = APIService.getPreferredVersion('configmaps');
    var secretsVersion = APIService.getPreferredVersion('secrets');

    var watches = [];

    var configMapDataOrdered = [];
    var secretDataOrdered = [];
    $scope.valueFromObjects = [];

    var getParamsPropertyName = function(strategyType) {
      switch (strategyType) {
      case "Recreate":
        return "recreateParams";
      case "Rolling":
        return "rollingParams";
      case "Custom":
        return "customParams";
      default:
        Logger.error('未知的部署策略类型: ' + strategyType);
        return;
      }
    };

    ProjectsService
      .get($routeParams.project)
      .then(_.spread(function(project, context) {
        $scope.project = project;
        $scope.context = context;

        if (!AuthorizationService.canI('deploymentconfigs', 'update', $routeParams.project)) {
          Navigate.toErrorPage('您没有权限更新部署配置 ' +
                               $routeParams.deploymentconfig + '。', 'access_denied');
          return;
        }

        DataService.get(deploymentConfigsVersion, $routeParams.deploymentconfig, context, { errorNotification: false }).then(
          // success
          function(deploymentConfig) {
            $scope.deploymentConfig = deploymentConfig;

            $scope.breadcrumbs = BreadcrumbsService.getBreadcrumbs({
              object: deploymentConfig,
              project: project,
              subpage: 'Edit'
            });

            // Create map which will associate concatiner name to container's data(envVar, trigger and image which will be used on manual deployment)
            var mapContainerConfigByName = function(containers, triggers) {
              var containerConfigByName = {};
              var imageChangeTriggers = _.filter(triggers, {type: 'ImageChange'});
              _.each(containers, function(container) {
                var imageChangeTriggerForContainer = _.find(imageChangeTriggers, function(trigger) {
                  return _.includes(trigger.imageChangeParams.containerNames, container.name);
                });
                var triggerData = {};
                container.env = container.env || [];
                containerConfigByName[container.name] = {
                  env: container.env,
                  image: container.image,
                  hasDeploymentTrigger: !_.isEmpty(imageChangeTriggerForContainer)
                };
                if (imageChangeTriggerForContainer) {
                  var triggerFromData = imageChangeTriggerForContainer.imageChangeParams.from;
                  var triggerImageNameParts = triggerFromData.name.split(':');
                  triggerData = {
                    data: imageChangeTriggerForContainer,
                    istag: {namespace: triggerFromData.namespace || $scope.projectName, imageStream: triggerImageNameParts[0], tagObject: {tag: triggerImageNameParts[1]}},
                    automatic: _.get(imageChangeTriggerForContainer, 'imageChangeParams.automatic', false)
                  };
                } else {
                  triggerData = {
                    istag: {namespace: "", imageStream: ""},
                    // Default to true when setting up a new image change trigger.
                    automatic: true
                  };
                }
                _.set(containerConfigByName, [container.name, 'triggerData'], triggerData);
              });
              return containerConfigByName;
            };

            $scope.updatedDeploymentConfig = angular.copy($scope.deploymentConfig);
            $scope.containerNames = _.map($scope.deploymentConfig.spec.template.spec.containers, 'name');
            $scope.containerConfigByName = mapContainerConfigByName($scope.updatedDeploymentConfig.spec.template.spec.containers, $scope.updatedDeploymentConfig.spec.triggers);
            $scope.secrets = {
              pullSecrets: angular.copy($scope.deploymentConfig.spec.template.spec.imagePullSecrets) || [{name: ''}]
            };
            $scope.volumeNames = _.map($scope.deploymentConfig.spec.template.spec.volumes, 'name');
            $scope.strategyData = angular.copy($scope.deploymentConfig.spec.strategy);
            $scope.originalStrategy = $scope.strategyData.type;
            $scope.strategyParamsPropertyName = getParamsPropertyName($scope.strategyData.type);
            $scope.triggers.hasConfigTrigger = _.some($scope.updatedDeploymentConfig.spec.triggers, {type: 'ConfigChange'});

            // If strategy is 'Custom' and no environment variables are present, initiliaze them.
            if ($scope.strategyData.type === 'Custom' && !_.has($scope.strategyData, 'customParams.environment')) {
              $scope.strategyData.customParams.environment = [];
            }

            DataService.list(configMapsVersion, context, null, { errorNotification: false }).then(function(configMapData) {
              configMapDataOrdered = orderByDisplayName(configMapData.by("metadata.name"));
              $scope.availableConfigMaps = configMapDataOrdered;
              $scope.valueFromObjects = configMapDataOrdered.concat(secretDataOrdered);
            }, function(e) {
              if (e.status === 403) {
                return;
              }

              displayError('不能加载配置映射', getErrorDetails(e));
            });

            DataService.list(secretsVersion, context, null, { errorNotification: false }).then(function(secretData) {
              secretDataOrdered = orderByDisplayName(secretData.by("metadata.name"));
              $scope.availableSecrets = secretDataOrdered;
              $scope.valueFromObjects = configMapDataOrdered.concat(secretDataOrdered);
              var secretsByType = SecretsService.groupSecretsByType(secretData);
              var secretNamesByType =_.mapValues(secretsByType, function(secretData) {return _.map(secretData, 'metadata.name');});
              // Add empty option to the image/source secrets
              $scope.secretsByType = _.each(secretNamesByType, function(secretsArray) {
                secretsArray.unshift("");
              });
            }, function(e) {
              if (e.status === 403) {
                return;
              }

              displayError('Could not load secrets', getErrorDetails(e));
            });

            // If we found the item successfully, watch for changes on it
            watches.push(DataService.watchObject(deploymentConfigsVersion, $routeParams.deploymentconfig, context, function(deploymentConfig, action) {
              if (action === 'MODIFIED') {
                $scope.alerts["updated/deleted"] = {
                  type: "warning",
                  message: "自从您开始编辑这个配置以来，这个配置已经发生了变化。您需要复制您所做的更改并重新编辑。"
                };
              }
              if (action === "DELETED") {
                $scope.alerts["updated/deleted"] = {
                  type: "warning",
                  message: "此部署配置已被删除。"
                };
                $scope.disableInputs = true;
              }
              $scope.deploymentConfig = deploymentConfig;
            }));
            $scope.loaded = true;
          },
          // failure
          function(e) {
            $scope.loaded = true;
            $scope.alerts["load"] = {
              type: "error",
              message: "无法加载部署配置细节。",
              details: $filter('getErrorDetails')(e)
            };
          }
        );
      })
    );

    // helper for detemining if strategy switch was done between Rolling <-> Recreate strategy
    var isRollingRecreateSwitch = function() {
      return ($scope.strategyData.type !== 'Custom' && $scope.originalStrategy !== 'Custom' && $scope.strategyData.type !== $scope.originalStrategy);
    };

    var promptToMoveParams = function(pickedStrategyParams) {
      if (_.has($scope.strategyData, pickedStrategyParams)) {
        return;
      }
      var modalInstance = $uibModal.open({
        templateUrl: 'views/modals/confirm.html',
        controller: 'ConfirmModalController',
        resolve: {
          modalConfig: function() {
            return {
              alerts: $scope.alerts,
              title: "保持现有的一些 " + $scope.originalStrategy.toLowerCase() + " 策略参数?",
              details: "The timeout parameter and any pre or post lifecycle hooks will be copied from " + $scope.originalStrategy.toLowerCase() + " strategy to " + $scope.strategyData.type.toLowerCase() + " strategy. After saving the changes, " + $scope.originalStrategy.toLowerCase() + " strategy parameters will be removed.",
              okButtonText: "是",
              okButtonClass: "btn-primary",
              cancelButtonText: "否"
            };
          }
        }
      });
      modalInstance.result.then(function () {
        // Move parameters that belong to the origial strategy to the picked one.
        $scope.strategyData[pickedStrategyParams] = angular.copy($scope.strategyData[getParamsPropertyName($scope.originalStrategy)]);
      }, function() {
        // Create empty parameters for the newly picked strategy
        $scope.strategyData[pickedStrategyParams] = {};
      });
    };

    $scope.strategyChanged = function() {
      var pickedStrategyParams = getParamsPropertyName($scope.strategyData.type);
      if (isRollingRecreateSwitch()) {
        promptToMoveParams(pickedStrategyParams);
      } else {
        if (!_.has($scope.strategyData, pickedStrategyParams)) {
          if ($scope.strategyData.type !== 'Custom') {
            $scope.strategyData[pickedStrategyParams] = {};
          } else {
            $scope.strategyData[pickedStrategyParams] = {
              image: "",
              command: [],
              environment: []
            };
          }
        }
      }
      $scope.strategyParamsPropertyName = pickedStrategyParams;
    };

    var assembleImageChangeTrigger = function(containerName, ist, trigger, automatic) {
      var istagObject = {
        kind: "ImageStreamTag",
        namespace: ist.namespace,
        name: ist.imageStream + ':' + ist.tagObject.tag
      };
      if (trigger) {
        trigger.imageChangeParams.from = istagObject;
        trigger.imageChangeParams.automatic = automatic;
      } else {
        trigger = {
          type: "ImageChange",
          imageChangeParams: {
            automatic: automatic,
            containerNames: [containerName],
            from: istagObject
          }
        };
      }
      return trigger;
    };

    var updateTriggers = function() {
      // Preserve any triggers we don't handle in the editor.
      var updatedTriggers = _.reject($scope.updatedDeploymentConfig.spec.triggers, function(trigger) {
        return trigger.type === 'ImageChange' || trigger.type === 'ConfigChange';
      });

      _.each($scope.containerConfigByName, function(containerData, containerName) {
        if (containerData.hasDeploymentTrigger) {
          updatedTriggers.push(assembleImageChangeTrigger(containerName,
                                                          containerData.triggerData.istag,
                                                          containerData.triggerData.data,
                                                          containerData.triggerData.automatic));
        } else {
          var imageSpec = _.find($scope.updatedDeploymentConfig.spec.template.spec.containers, { name: containerName });
          imageSpec.image = containerData.image;
        }
      });
      if ($scope.triggers.hasConfigTrigger) {
        updatedTriggers.push({
          type: "ConfigChange"
        });
      }
      return updatedTriggers;
    };

    var hideErrorNotifications = function() {
      NotificationsService.hideNotification("edit-deployment-config-error");
    };

    $scope.save = function() {
      $scope.disableInputs = true;

      // Update env for each container
      _.each($scope.containerConfigByName, function(containerData, containerName) {
        var matchingContainer = _.find($scope.updatedDeploymentConfig.spec.template.spec.containers, { name: containerName });
        matchingContainer.env = keyValueEditorUtils.compactEntries(containerData.env);
      });

      // Remove parameters of previously set strategy, if user moved
      if (isRollingRecreateSwitch()) {
        delete $scope.strategyData[getParamsPropertyName($scope.originalStrategy)];
      }

      if ($scope.strategyData.type === 'Rolling') {
        // Need to normalize to null / number / string depending on what the user sets
        var maxSurge = $scope.strategyData[$scope.strategyParamsPropertyName].maxSurge;
        var parsedMaxSurge = Number(maxSurge);
        if (maxSurge === "") {
          $scope.strategyData[$scope.strategyParamsPropertyName].maxSurge = null;
        }
        else if (_.isFinite(parsedMaxSurge)) {
          $scope.strategyData[$scope.strategyParamsPropertyName].maxSurge = parsedMaxSurge;
        }
        var maxUnavailable = $scope.strategyData[$scope.strategyParamsPropertyName].maxUnavailable;
        var parsedMaxUnavailable = Number(maxUnavailable);
        if (maxUnavailable === "") {
          $scope.strategyData[$scope.strategyParamsPropertyName].maxUnavailable = null;
        }
        else if (_.isFinite(parsedMaxUnavailable)) {
          $scope.strategyData[$scope.strategyParamsPropertyName].maxUnavailable = parsedMaxUnavailable;
        }
      }

      if ($scope.strategyData.type !== 'Custom') {
        _.each(['pre', 'mid', 'post'], function(hookType) {
          if (_.has($scope.strategyData, [$scope.strategyParamsPropertyName, hookType, 'execNewPod', 'env'])) {
            $scope.strategyData[$scope.strategyParamsPropertyName][hookType].execNewPod.env = keyValueEditorUtils.compactEntries($scope.strategyData[$scope.strategyParamsPropertyName][hookType].execNewPod.env);
          }
        });
      }
      if (_.has($scope, 'strategyData.customParams.environment')) {
        $scope.strategyData.customParams.environment = keyValueEditorUtils.compactEntries($scope.strategyData.customParams.environment);
      }
      // Update image pull secrets
      $scope.updatedDeploymentConfig.spec.template.spec.imagePullSecrets = _.filter($scope.secrets.pullSecrets, 'name');
      $scope.updatedDeploymentConfig.spec.strategy = $scope.strategyData;
      $scope.updatedDeploymentConfig.spec.triggers = updateTriggers();

      hideErrorNotifications();
      DataService.update(deploymentConfigsVersion, $scope.updatedDeploymentConfig.metadata.name, $scope.updatedDeploymentConfig, $scope.context).then(
        function() {
          NotificationsService.addNotification({
            type: "success",
            message: "部署配置 " + $scope.updatedDeploymentConfig.metadata.name + " 已成功更新。"
          });
          var returnURL = Navigate.resourceURL($scope.updatedDeploymentConfig);
          $location.url(returnURL);
        },
        function(result) {
          $scope.disableInputs = false;
          NotificationsService.addNotification({
            id: "edit-deployment-config-error",
            type: "error",
            message: "更新部署配置时出错 " + $scope.updatedDeploymentConfig.metadata.name + "。",
            details: $filter('getErrorDetails')(result)
          });
        }
      );
    };

    $scope.cancel = function() {
      $window.history.back();
    };

    $scope.$on('$destroy', function(){
      DataService.unwatchAll(watches);
      hideErrorNotifications();
    });
  });
