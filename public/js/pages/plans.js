angular.element(document).ready(() => {
    init_materialize();
});

const app = angular.module('global_app', ['ngSanitize', 'ngAnimate', 'loaderM', 'timersM', 'plansM', 'usersM'])

    .controller('body_controller', ($scope, $http, $window, $timeout, preloader, plans_s, users_s, timers_manager_s, dark_area) => {
        ng_init_sidenav(dark_area);
        timers_manager_s.init($scope, $http, $timeout, preloader);
        plans_s.init($scope, $http, timers_manager_s, preloader);
        users_s.init($scope, $http, timers_manager_s, preloader);

        $scope.Math = window.Math;
        $scope.get_css_property = (property, value) => {
            let ret_val = {};
            ret_val[property] = value;
            return ret_val;
        };

        $scope.register_and_begin_plan = (username, plan_name) => {
            $scope.register_to_plan(username, plan_name).done(() => {
                $window.location.href = '/view/plans/' + plan_name;
            })
        };
    });