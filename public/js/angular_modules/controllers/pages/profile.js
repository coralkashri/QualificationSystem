angular.element(document).ready(() => {
    init_materialize();
});

const app = angular.module('global_app', ['ngSanitize', 'ngAnimate', 'loaderM'])

    .controller('body_controller', ($scope, $http, $window, $timeout, preloader, dark_area) => {
        ng_init_sidenav(dark_area);
    });