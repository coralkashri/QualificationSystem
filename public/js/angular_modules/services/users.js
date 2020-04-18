angular.module("usersM", [])

    .service("users_s", function() {
        let _$scope, _$http, _timers_manager, _preloader;

        this.init = ($scope, $http, timers_manager, preloader) => {
            _$http = $http;
            _$scope = $scope;
            _timers_manager = timers_manager;
            _preloader = preloader;

            _$scope.get_plan_progress = (username, plan_name) => {
                let deferred = $.Deferred();
                _preloader.start();

                _$http({
                    method: "GET",
                    url: "/api/users/u" + username + "/plans/" + plan_name + "/progress",
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    _$scope.plan = {
                        is_registered: true
                    };
                    _$scope.plan.progress = response.data;
                    alertify.success(response.message);
                    deferred.resolve(_$scope.plan);
                }, (response) => {
                    response = response.data;
                    _$scope.plan = {
                        is_registered: false
                    };
                    //alertify.error(response.message);
                    deferred.reject(response.message);
                }).finally(() => {
                    _preloader.stop();
                });
                return deferred.promise();
            };

            _$scope.register_to_plan = (username, plan_name) => {
                let deferred = $.Deferred();
                _preloader.start();

                _$http({
                    method: "POST",
                    url: "/api/users/u" + username + "/register/" + plan_name,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    let new_user_details = response.data;
                    alertify.success("Successfully registered to plan.");
                    deferred.resolve("Register Success");
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                    deferred.reject("Register Failed");
                }).finally(() => {
                    _preloader.stop();
                });
                return deferred.promise();
            };

            _$scope.get_user_plans = (username) => {
                let deferred = $.Deferred();
                _preloader.start();

                _$http({
                    method: "GET",
                    url: "/api/users/u" + username + "/registered-plans",
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    _$scope.plans_list = response.data;
                    alertify.success(response.message);
                    deferred.resolve("Success");
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                    deferred.reject("Failed");
                }).finally(() => {
                    _preloader.stop();
                });
                return deferred.promise();
            };

            _$scope.get_user_current_task = (username, plan_name) => {
                let deferred = $.Deferred();
                _preloader.start();

                _$http({
                    method: "GET",
                    url: "/api/users/u" + username + "/plans/" + plan_name + "/current-task",
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    _$scope.task_details = response.data[0];
                    alertify.success(response.message);
                    deferred.resolve(_$scope.task_details);
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                    deferred.reject(response.message);
                }).finally(() => {
                    _preloader.stop();
                });
                return deferred.promise();
            };
        };
    });