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

            _$scope.submit_task = (task_details, learner_answer) => {
                let deferred = $.Deferred();
                _preloader.start();

                // Read answer
                let promises = [];
                if (!learner_answer) {
                    switch (task_details.answer_type) {
                        case "FILES":
                            let files_input = $("#files_answer");
                            let formData = new FormData();
                            for (let file_num = 0; file_num < files_input.files.length; file_num++) {
                                formData.append("files_to_upload", files_inputs[i].files[file_num]);
                            }
                            promises.push($http.post("/api/uploads/upload", formData, {
                                //headers: {enctype:'multipart/form-data'}
                                transformRequest: angular.identity,
                                headers: {'Content-Type': undefined, enctype: 'multipart/form-data'}
                            }));
                            break;
                    }
                }

                Promise.all(promises).then(() => {
                    _$http({
                        method: "POST",
                        url: "/api/users/u" + username + "/plans/" + plan_name + "/submit/" + task_details._id,
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                    }).then((response) => {
                        response = response.data;
                        $scope.task_submit_result = response.data[0];
                        $("#task_submit_result_modal").modal('open');
                        deferred.resolve(_$scope.task_details);
                    }, (response) => {
                        response = response.data;
                        alertify.error(response.message);
                        deferred.reject(response.message);
                    }).finally(() => {
                        _preloader.stop();
                    });
                }).catch((msg) => {
                    _preloader.stop();
                    alertify.error(msg);
                    deferred.reject(msg);
                });
                return deferred.promise();
            };
        };
    });