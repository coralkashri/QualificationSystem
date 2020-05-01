angular.element(document).ready(() => {
    init_materialize();
});

const app = angular.module('global_app', ['ngSanitize', 'ngAnimate', 'angularValidator', 'loaderM', 'globalDataM', 'usersM', 'timersM'])

    .controller('body_controller', ($scope, $http, $window, $timeout, timers_manager_s, preloader, dark_area, users_s, users_roles_s) => {
        ng_init_sidenav(dark_area);
        users_roles_s.init($scope);
        users_s.init($scope, $http, timers_manager_s, preloader);

        $scope.get_user_details = (username) => {

            users_s.get_user_details(username).then(() => {
                M.updateTextFields();
            });
        };
    });