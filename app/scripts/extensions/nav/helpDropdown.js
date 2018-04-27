'use strict';

angular.module('openshiftConsole')
  // prepopulating extension points with some of our own data
  // (ensures a single interface for extending the UI)
  .run(function(extensionRegistry) {
    extensionRegistry
      .add('nav-help-dropdown', function() {
        var options = [];
        options.push(
          {
            type: 'dom',
            node: '<li><a target="_blank" href="{{\'default\' | helpLink}}">文档</a></li>'
          }
        );

        if (!_.get(window, 'OPENSHIFT_CONSTANTS.DISABLE_SERVICE_CATALOG_LANDING_PAGE')) {
          var tourConfig = _.get(window, 'OPENSHIFT_CONSTANTS.GUIDED_TOURS.landing_page_tour');
          if (tourConfig && tourConfig.enabled && tourConfig.steps) {
            options.push(
              {
                type: 'dom',
                node: '<li><a href="catalog?startTour=true">访问主页向导</a></li>'
              }
            );
          }
        }

        options.push(
          {
            type: 'dom',
            node: '<li><a href="command-line">命令行工具</a></li>'
          }
        );
        options.push(
          {
            type: 'dom',
            node: '<li><a href="about">关于</a></li>'
          }
        );
        return options;
      })
  });
