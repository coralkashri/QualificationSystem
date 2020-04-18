angular.module("adminPlansM", [])

    .service("admin_plans_s", function() {
        let _$scope, _$http, _timers_manager, _modals, _preloader;

        this.init = ($scope, $http, timers_manager, modals_manager, preloader) => {
            _$http = $http;
            _$scope = $scope;
            _timers_manager = timers_manager;
            _preloader = preloader;
            _modals = modals_manager;

            _$scope.create_plan = (plan_data) => {
                let params = $.param({
                    description: plan_data.description,
                    estimated_days: plan_data.estimated_days,
                    tasks_route: plan_data.tasks_route,
                    active_status: !!plan_data.is_active
                });
                _$http({
                    method: "POST",
                    url: "/api/plans/create/" + plan_data.name,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    _$scope.back_to_parent_category();
                    alertify.success(response.message);
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            _$scope.modify_plan = (target_plan_name, plan_data) => {
                let params = $.param({
                    new_plan_name: plan_data.name,
                    new_description: plan_data.description,
                    new_estimated_days: plan_data.estimated_days,
                    new_tasks_route: plan_data.tasks_route,
                    active_status: !!plan_data.is_active
                });
                _$http({
                    method: "POST",
                    url: "/api/plans/modify/" + target_plan_name,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    _$scope.back_to_parent_category();
                    alertify.success(response.message);
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            _$scope.archive_plan = (plan_name) => {
                let params = $.param({
                    active_status: false
                });
                _$http({
                    method: "POST",
                    url: "/api/plans/modify/" + plan_name,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success("Plan successfully archived.");
                    _$scope.get_all_plans();
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            _$scope.reactivate_plan = (plan_name) => {
                let params = $.param({
                    active_status: true
                });
                _$http({
                    method: "POST",
                    url: "/api/plans/modify/" + plan_name,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success("Plan successfully activated.");
                    _$scope.get_all_plans();
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            _$scope.delete_plan = (plan_name) => {
                _modals.create_new_confirmation_modal("delete_confirm_modal",
                    "Delete plan " + plan_name,
                    "After deleting this plan, the specific route will be lost forever, and users on this plan will be removed from it.",
                    "delete plan " + plan_name, (ans) => {
                        if (ans) {
                            _$http({
                                method: "POST",
                                url: "/api/plans/remove/" + plan_name,
                                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                            }).then((response) => {
                                response = response.data;
                                alertify.success(response.message);
                                _$scope.get_all_plans();
                            }, (response) => {
                                response = response.data;
                                alertify.error(response.message);
                            });
                        } else {
                            alertify.success("Plan is here to stay!");
                        }
                    });
            };
        };
    });