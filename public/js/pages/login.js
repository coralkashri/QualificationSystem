angular.element(document).ready(() => {
    init_materialize();
});

const app = angular.module('global_app', ['ngSanitize', 'ngAnimate', 'loaderM'])

    .controller('body_controller', ($scope, $http, $window, $timeout, preloader, dark_area) => {
        ng_init_sidenav(dark_area);

        $scope.login = _ => {
            if (!$scope.username_model.length || !$scope.password_model.length) {
                alertify.error("Please enter username and password.");
                return;
            }
            let route = "/api/login/" + $scope.username_model;
            let params = {
                password: $scope.password_model
            };
            $http({
                method: "GET",
                url: route,
                params: params,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then((response) => {
                response = response.data;
                alertify.success(response.message);
                $window.location.reload();
            }, (response) => {
                response = response.data;
                alertify.error(response.message);
            });
        }
    });