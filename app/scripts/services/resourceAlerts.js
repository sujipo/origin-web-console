'use strict';

angular.module("openshiftConsole")
  .factory("ResourceAlertsService",
           function($filter,
                    AlertMessageService,
                    DeploymentsService,
                    Navigate,
                    NotificationsService,
                    QuotaService) {
    var annotation = $filter('annotation');
    var humanizeKind = $filter('humanizeKind');
    var deploymentStatus = $filter('deploymentStatus');
    var getGroupedPodWarnings = $filter('groupedPodWarnings');

    var getPodAlerts = function(pods, namespace) {
      if (_.isEmpty(pods)) {
        return {};
      }

      var alerts = {};
      var groupedPodWarnings = getGroupedPodWarnings(pods);
      _.each(groupedPodWarnings, function(podWarnings, groupID) {
        var warning = _.head(podWarnings);
        if (!warning) {
          return;
        }

        var alertID = "pod_warning" + groupID;
        var alert = {
          type: warning.severity || 'warning',
          message: warning.message
        };

        // Handle certain warnings specially.
        switch (warning.reason) {
          case "Looping":
          case "NonZeroExit":
            // Add a View Log link for crashing containers.
            var podLink = Navigate.resourceURL(warning.pod, "Pod", namespace);
            var logLink = URI(podLink).addSearch({ tab: "logs", container: warning.container }).toString();
            alert.links = [{
              href: logLink,
              label: "查看日志"
            }];
            break;

          case "NonZeroExitTerminatingPod":
            // Allow users to permanently dismiss the non-zero exit code message for terminating pods.
            if (AlertMessageService.isAlertPermanentlyHidden(alertID, namespace)) {
              return;
            }

            alert.links = [{
              href: "",
              label: "别再给我看了",
              onClick: function() {
                // Hide the alert on future page loads.
                AlertMessageService.permanentlyHideAlert(alertID, namespace);

                // Return true close the existing alert.
                return true;
              }
            }];
            break;
        }

        alerts[alertID] = alert;
      });

      return alerts;
    };

    var setQuotaNotifications = function(quotas, clusterQuotas, projectName) {
      var notifications = QuotaService.getQuotaNotifications(quotas, clusterQuotas, projectName);
      _.each(notifications, function(notification) {
        if(!NotificationsService.isNotificationPermanentlyHidden(notification)) {
          NotificationsService.addNotification(notification);
        }
      });
    };

    // deploymentConfig, k8s deployment
    var getPausedDeploymentAlerts = function(deployment) {
      var alerts = {};
      if(_.get(deployment, 'spec.paused')) {
        alerts[deployment.metadata.uid + '-paused'] = {
          type: 'info',
          message: deployment.metadata.name + ' is paused.',
          details: '这将阻止任何新的部署或触发器运行，直到恢复。',
          links: [{
            href: "",
            label: '继续部署',
            onClick: function() {
              DeploymentsService.setPaused(deployment, false, {namespace: deployment.metadata.namespace}).then(
                _.noop,
                function(e) {
                  alerts[deployment.metadata.uid + '-pause-error'] = {
                    type: "error",
                    message: "发生错误在恢复 " + humanizeKind(deployment.kind) + "。",
                    details: $filter('getErrorDetails')(e)
                  };
                });
              return true;
            }
          }]
        };
      }
      return alerts;
    };

    var getDeploymentStatusAlerts = function(deploymentConfig, mostRecentRC) {
      if (!deploymentConfig || !mostRecentRC) {
        return {};
      }

      var alerts = {};
      var dcName = _.get(deploymentConfig, 'metadata.name');

      // Show messages about cancelled or failed deployments.
      var logLink;
      var status = deploymentStatus(mostRecentRC);
      var version = annotation(mostRecentRC, 'deploymentVersion');
      var displayName = version ? (dcName + ' #' + version) : mostRecentRC.metadata.name;
      var rcLink = Navigate.resourceURL(mostRecentRC);
      switch (status) {
      case 'Cancelled':
        alerts[mostRecentRC.metadata.uid + '-cancelled'] = {
          type: 'info',
          message: '部署 ' + displayName + ' 被取消。',
          // TODO: Add back start deployment link from previous overview (see serviceGroupNotifications.js)
          links: [{
            href: rcLink,
            label: '查看部署'
          }]
        };
        break;
      case 'Failed':
        logLink = URI(rcLink).addSearch({ tab: "logs" }).toString();
        alerts[mostRecentRC.metadata.uid + '-failed'] = {
          type: 'error',
          message: '部署 ' + displayName + ' 失败。',
          reason: annotation(mostRecentRC, 'openshift.io/deployment.status-reason'),
          links: [{
            href: logLink,
            label: '查看日志'
          }, {
            // Show all events since the event might not be on the replication controller itself.
            href: 'project/' + mostRecentRC.metadata.namespace + '/browse/events',
            label: '查看事件'
          }]
        };
        break;
      }
      return alerts;
    };

    var makeConditionAlert = function(alerts, uid, condition, type) {
      alerts[uid+'-'+condition.reason] = {
        type: type,
        message: condition.message
      };
    };

    var getServiceInstanceAlerts = function(instance) {
      var alerts = {};
      if(!instance) {
        return alerts;
      }
      var uid = instance.metadata.uid;
      var namespaceError = _.find(instance.status.conditions, {reason: 'ErrorFindingNamespaceForInstance'});
      var provisionFail = _.find(instance.status.conditions, {reason: 'ProvisionFailed'});
      var deprovisionFail = _.find(instance.status.conditions, {reason: 'DeprovisioningFailed'});

      if(namespaceError) {
        makeConditionAlert(alerts, uid, namespaceError, 'warning');
      }
      if(provisionFail) {
        makeConditionAlert(alerts, uid, provisionFail, 'error');
      }
      if(deprovisionFail) {
        makeConditionAlert(alerts, uid, deprovisionFail, 'error');
      }
      return alerts;
    };

    return {
      getPodAlerts: getPodAlerts,
      getDeploymentStatusAlerts: getDeploymentStatusAlerts,
      getPausedDeploymentAlerts: getPausedDeploymentAlerts,
      getServiceInstanceAlerts: getServiceInstanceAlerts,
      setQuotaNotifications: setQuotaNotifications
    };
  });
