angular.module("plansM", [])

    .service("plans_s", function() {
        let _$scope, _$http, _timers_manager, _preloader;
        let timers = {};

        this.init = ($scope, $http, timers_manager, preloader) => {
            _$http = $http;
            _$scope = $scope;
            _timers_manager = timers_manager;
            _preloader = preloader;

            _$scope.get_plan_progress = () => {
                return 55; // TODO ajax
            };

            _$scope.get_all_plans = () => {
                _$http({
                    method: "GET",
                    url: "/api/plans",
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    let plans_list = response.data;
                    _$scope.plans_list = plans_list;
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            _$scope.get_plan_details = (plan_name) => {
                _$http({
                    method: "GET",
                    url: "/api/plans/" + plan_name,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    let selected_plan = response.data;
                    _$scope.selected_plan_details = selected_plan;
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            }
        };
    });