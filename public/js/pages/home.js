angular.element(document).ready(() => {
    init_materialize();
    document.getElementById("new_version_version_release_date").valueAsDate = new Date(); // TODO pay attention - a troubles maker
    //document.getElementById("filter_version_release_date").valueAsDate = new Date(new Date() + " EDT");
});

const app = angular.module('global_app', ['ngSanitize', 'ngAnimate', 'pagingM', 'searchM', 'versionsM', 'versionsPropertiesM', 'modalsM', 'loaderM', 'timersM'])

    .controller('body_controller', ($scope, $http, $timeout, versions_search_s, versions_s, properties_s, paging_s, modals_s, preloader, dark_area, timers_manager_s) => {
        timers_manager_s.init($scope, $http, $timeout, preloader);
        versions_search_s.init($scope, $http, timers_manager_s, preloader);
        versions_s.init($scope, $http, modals_s, timers_manager_s);
        properties_s.init($scope, $http);
        modals_s.init($scope, preloader, dark_area);

        $scope.num_versions_for_page_model = 2;
        $scope.num_properties_for_page_model = 3;
        paging_s.init($scope, preloader, dark_area);

        ng_init_sidenav(dark_area);

        $(document).ready(() => {
            $('.modal').modal({
                startingTop: '5%',
                endingTop: '15%'
            });
        });
    })

    .factory('skipReload', [
        '$route',
        '$rootScope',
        function ($route, $rootScope) {
            return function () {
                var lastRoute = $route.current;
                var un = $rootScope.$on('$locationChangeSuccess', function () {
                    $route.current = lastRoute;
                    un();
                });
            };
        }
    ])

    .run(function($animate) {
        $animate.enabled(true);
    });