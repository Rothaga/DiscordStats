var supervisorApp = angular.module('supervisorApp', [ 'ngRoute', 'ngMaterial', 'ngAnimate', 'md.data.table', 'ngMessages']);
supervisorApp.config(['$routeProvider', '$locationProvider', '$httpProvider', '$mdThemingProvider', '$compileProvider',
    function($routeProvider, $locationProvider, $httpProvider, $mdThemingProvider, $compileProvider) {
        $httpProvider.useApplyAsync(true);
		$httpProvider.defaults.withCredentials = true;
		//$httpProvider.defaults.useXDomain = true;


        $compileProvider.debugInfoEnabled(true);

        // $mdThemingProvider.disableTheming();
        //uncomment the theme code and run the following code to compile. It will copy the result to the clipboard
        // copy([].slice.call(document.styleSheets)
        //    .map(e => e.ownerNode)
        //    .filter(e => e.hasAttribute('md-theme-style'))
        //    .map(e => e.textContent)
        //    .join('\n')
        //  )

        // var cyanLight = $mdThemingProvider.extendPalette('cyan', {
        //   'contrastDefaultColor': 'light'
        // });
        // $mdThemingProvider.definePalette('cyanLight', cyanLight);

        $mdThemingProvider.definePalette('white', {
            '50': 'ffffff',
            '100': 'ffffff',
            '200': 'ffffff',
            '300': 'ffffff',
            '400': 'ffffff',
            '500': 'ffffff',
            '600': 'ffffff',
            '700': 'ffffff',
            '800': 'ffffff',
            '900': 'ffffff',
            'A100': 'ffffff',
            'A200': 'ffffff',
            'A400': 'ffffff',
            'A700': 'ffffff'
        });
        $mdThemingProvider.theme('icon')
            .primaryPalette('white');

        // $mdThemingProvider.theme('default')
        //     .primaryPalette('cyanLight')
        //     .accentPalette('white');

        $mdThemingProvider.theme('default')
            .primaryPalette('blue-grey')
            .accentPalette('blue-grey');

        $mdThemingProvider.theme('dark')
            .primaryPalette('blue-grey').dark()
            .accentPalette('blue-grey');

        $routeProvider
          .when('/?', {
            template: '',
            controller: function ($location,$rootScope) {
              $location.path("google.com");
              var hash = $location.path().substr(1);

              var splitted = hash.split('&');
              var params = {};

              for (var i = 0; i < splitted.length; i++) {
                var param  = splitted[i].split('=');
                var key    = param[0];
                var value  = param[1];
                params[key] = value;
                $rootScope.accesstoken=params;
              }
              $location.path("/main/main.html");
            }
          })

}]);
