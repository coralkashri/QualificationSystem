angular.element(document).ready(() => {
    init_materialize();
});

const app = angular.module('global_app', ['ngSanitize', 'ngAnimate', 'loaderM', 'adminUsersM'])

    .controller('body_controller', ($scope, $http, $window, $timeout, $location, preloader, dark_area, adminUsers) => {
        ng_init_sidenav(dark_area);
        adminUsers.init($scope, $http, preloader);

        $scope.get_user_details = (username) => {
            adminUsers.get_user_details(username, (data) => {
                $('#user_role').val(data.role);
                $('select').formSelect();
            })
        };
    });