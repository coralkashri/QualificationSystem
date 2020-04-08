angular.module("plansM", [])

    .service("plans_s", function() {
        let _$scope, _$http, _timers_manager, _preloader;

        this.init = ($scope, $http, timers_manager, preloader) => {
            _$http = $http;
            _$scope = $scope;
            _timers_manager = timers_manager;
            _preloader = preloader;

            _$scope.get_plan_progress = () => {
                return 55; // TODO ajax
            };

            _$scope.get_all_plans = (username) => {
                let deferred = $.Deferred();
                _preloader.start();

                let url = username ? "/api/users/u" + username + "/available-plans" : "/api/plans";

                _$http({
                    method: "GET",
                    url: url,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    let new_plans_list = response.data;
                    if (_$scope.plans_list) {
                        _$scope.plans_list.splice(0, _$scope.plans_list.length); // Clear this array
                        timers_manager.add_timer("update_plans_list", _ => {
                            for (let i = 0; i < new_plans_list.length; i++)
                                _$scope.plans_list.push(new_plans_list[i]);
                            _preloader.stop();
                        }, 650);
                        timers_manager.start_timer("update_plans_list");
                    } else {
                        _$scope.plans_list = new_plans_list;
                        _preloader.stop();
                    }
                    deferred.resolve("Update Success");
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                    _preloader.stop();
                    deferred.reject("Update Failed");
                });
                return deferred.promise();
            };

            _$scope.get_plan_details = (plan_name) => {
                this.get_plan_details(plan_name);
            }
        };

        this.get_plan_details = (plan_name, success_cb, error_cb, cb) => {
            _$http({
                method: "GET",
                url: "/api/plans/p" + plan_name,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then((response) => {
                response = response.data;
                alertify.success(response.message);
                _$scope.plan_data = response.data[0];
                success_cb && success_cb(_$scope.plan_data);
            }, (response) => {
                response = response.data;
                alertify.error(response.message);
                error_cb && error_cb();
            }).finally(() => {
                cb && cb();
            });
        }
    });