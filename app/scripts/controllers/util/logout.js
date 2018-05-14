'use strict';

/**
 * @ngdoc function
 * @name openshiftConsole.controller:LogoutController
 * @description
 * # LogoutController
 * Controller of the openshiftConsole
 */
angular.module('openshiftConsole')
  .controller('LogoutController', function ($scope, $routeParams, $log, AuthService, AUTH_CFG) {
    $log.debug("LogoutController");

    if (AuthService.isLoggedIn()) {
      $log.debug("LogoutController, logged in, initiating logout");
      $scope.logoutMessage = "退出中...";

      AuthService.startLogout().finally(function(){
        // Make sure the logout completed
        if (AuthService.isLoggedIn()) {
          $log.debug("LogoutController, logout failed, still logged in");
          $scope.logoutMessage = '您不能退出系统. 返回 <a href="./">控制台</a>.';
        } else {
          if (AUTH_CFG.logout_uri) {
            $log.debug("LogoutController, logout completed, redirecting to AUTH_CFG.logout_uri", AUTH_CFG.logout_uri);
            window.location.href = AUTH_CFG.logout_uri;
          } else {
            $log.debug("LogoutController, logout completed, reloading the page");
            window.location.reload(false);
          }
        }
      });
    } else if (AUTH_CFG.logout_uri) {
      $log.debug("LogoutController, logout completed, redirecting to AUTH_CFG.logout_uri", AUTH_CFG.logout_uri);
      $scope.logoutMessage = "Logging out...";
      window.location.href = AUTH_CFG.logout_uri;
    } else {
      $log.debug("LogoutController, not logged in, logout complete");

      var logoutMessage = "您已经退出系统。";
      if ($routeParams.cause === "timeout") {
        logoutMessage = "由于不活动，您已经注销。"
      }
      $scope.logoutMessage = logoutMessage + ' 返回 <a href="./">控制台</a>.';
    }
  });
