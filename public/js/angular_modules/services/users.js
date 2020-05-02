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

            _$scope.edit_profile = (current_username, current_password, user_data) => {
                let deferred = $.Deferred();
                _preloader.start();

                let route = "/api/users/modify/" + current_username;

                let pre_params = {
                    current_password: current_password
                };
                let new_username = user_data.username;
                let new_password = user_data.password;
                if (new_username) pre_params.username = new_username;
                if (new_password) pre_params.password = new_password;

                let params = $.param(pre_params);
                _$http({
                    method: "POST",
                    url: route,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success(response.message);
                    deferred.resolve(response.message);
                    if (new_username) {
                        location.href = "/view/users/" + new_username+ "/profile"
                    }
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                    deferred.reject(response.message);
                }).finally(() => {
                    _preloader.stop();
                });
                return deferred.promise();
            };

            _$scope.submit_task = (task_details, learner_answer, username, plan_name) => {
                this.submit_task(task_details, learner_answer, username, plan_name);
            };

            _$scope.skip_task = (task_details, username, plan_name) => {
                this.skip_task(task_details, username, plan_name);
            };
        };

        this.get_user_details = (username) => {
            let deferred = $.Deferred();
            _preloader.start();
            _$http({
                method: "GET",
                url: "/api/users/u" + username,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then((response) => {
                response = response.data;
                _$scope.user_data = response.data[0];
                deferred.resolve(_$scope.user_data);
            }, (response) => {
                response = response.data;
                alertify.error(response.message);
                deferred.reject(response.message);
            }).finally(() => {
                _preloader.stop();
            });
            return deferred.promise();
        };

        this.submit_task = (task_details, learner_answer, username, plan_name) => {
            let deferred = $.Deferred();
            _preloader.start();

            let pre_params = {};

            // Read answer
            let promises = [];
            if (!learner_answer) {
                switch (task_details.answer_type) {
                    case "FILES":
                        pre_params.answer = [];
                        let files_input = $("#files_answer")[0];
                        let formData = new FormData();
                        for (let file_num = 0; file_num < files_input.files.length; file_num++) {
                            formData.append("files_to_upload", files_input.files[file_num]);
                        }
                        promises.push(_$http.post("/api/uploads/upload", formData, {
                            //headers: {enctype:'multipart/form-data'}
                            transformRequest: angular.identity,
                            headers: {'Content-Type': undefined, enctype: 'multipart/form-data'}
                        }));
                        break;
                }
            } else {
                if (typeof learner_answer == "string")
                    learner_answer = [learner_answer];
                pre_params.answer = learner_answer;
            }

            Promise.all(promises).then((responses) => {
                // Get file names
                for (let i = 0; i < responses.length; i++) {
                    let response = responses[i].data.data;
                    pre_params.answer.push.apply(pre_params.answer, response);
                }

                pre_params.answer = JSON.stringify(pre_params.answer);

                let params = $.param(pre_params);

                _$http({
                    method: "POST",
                    url: "/api/users/u" + username + "/plans/" + plan_name + "/submit/" + task_details._id,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    _$scope.task_submit_result = response.data;
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

        this.skip_task = (task_details, username, plan_name) => {
            let deferred = $.Deferred();
            _preloader.start();

            _$http({
                method: "POST",
                url: "/api/users/u" + username + "/plans/" + plan_name + "/skip/" + task_details._id,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then((response) => {
                response = response.data;
                _$scope.task_details = response.data[0];
                location.reload();
                deferred.resolve(_$scope.task_details);
            }, (response) => {
                response = response.data;
                alertify.error(response.message);
                deferred.reject( response.message);
            }).finally(() => {
                _preloader.stop();
            });
            return deferred.promise();
        };
    });