angular.module("adminTasksM", [])

    .service("admin_tasks_s", function() {
        let _$scope, _$http, _timers_manager, _modals, _preloader;

        this.init = ($scope, $http, timers_manager, modals_manager, preloader) => {
            _$http = $http;
            _$scope = $scope;
            _timers_manager = timers_manager;
            _preloader = preloader;
            _modals = modals_manager;

            _$scope.get_all_tasks = () => {
                let deferred = $.Deferred();
                _preloader.start();

                _$http({
                    method: "GET",
                    url: "/api/tasks",
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    let new_tasks_list = response.data;
                    if (_$scope.tasks_list) {
                        _$scope.tasks_list.splice(0, _$scope.tasks_list.length); // Clear this array
                        _timers_manager.add_timer("update_tasks_list", _ => {
                            for (let i = 0; i < new_tasks_list.length; i++)
                                _$scope.tasks_list.push(new_tasks_list[i]);
                            _preloader.stop();
                        }, 650);
                        _timers_manager.start_timer("update_tasks_list");
                    } else {
                        _$scope.tasks_list = new_tasks_list;
                        _preloader.stop();
                    }
                    deferred.resolve("Success");
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                    _preloader.stop();
                    deferred.reject("Failed");
                });
                return deferred.promise();
            };

            _$scope.create_task = (task_data) => {
                // TODO add validations

                let pre_params = {
                    title: task_data.title,
                    topic_name: task_data.topic_name,
                    details: task_data.details,
                    search_keywords: JSON.stringify(task_data.get_search_keywords()),
                    check_point: task_data.check_point,
                    code_sections: JSON.stringify(task_data.code_sections),
                    answer_type: task_data.answer_type,
                    answer_options: JSON.stringify(task_data.answer_options),
                    answer: JSON.stringify(task_data.answer),
                    judgement_criteria: JSON.stringify(task_data.judgement_criteria),
                    hints: JSON.stringify(task_data.hints),
                    plan_exceptions: JSON.stringify(task_data.plan_exceptions)
                };

                // Collect files
                pre_params.file_names = [];
                let promises = [];
                let files_inputs = $("#files_section input[type='file']");
                for (let i = 0; i < files_inputs.length; i++) {
                    let formData = new FormData();
                    let files = [];
                    for (let file_num = 0; file_num < files_inputs[i].files.length; file_num++) {
                        formData.append("files_to_upload", files_inputs[i].files[file_num]);
                    }
                    //formData.append("files_to_upload", files_inputs[i].files);
                    promises.push($http.post("/api/uploads/upload", formData, {
                        //headers: {enctype:'multipart/form-data'}
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined, enctype: 'multipart/form-data'}
                    }));
                }
                Promise.all(promises).then((responses) => {
                    // All files are uploaded
                    // Get file names
                    for (let i = 0; i < responses.length; i++) {
                        let response = responses[i].data.data;
                        pre_params.file_names.push.apply(pre_params.file_names, response);
                    }
                    pre_params.file_names = JSON.stringify(pre_params.file_names);

                    let params = $.param(pre_params);
                    _$http({
                        method: "POST",
                        url: "/api/tasks/create",
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
                });
            };

            _$scope.modify_task = (task_data) => {
                // TODO add validations

                let pre_params = {
                    title: task_data.title,
                    topic_name: task_data.topic_name,
                    details: task_data.details,
                    search_keywords: JSON.stringify(task_data.get_search_keywords()),
                    check_point: task_data.check_point,
                    code_sections: JSON.stringify(task_data.code_sections),
                    answer_type: task_data.answer_type,
                    answer_options: JSON.stringify(task_data.answer_options),
                    answer: JSON.stringify(task_data.answer),
                    judgement_criteria: JSON.stringify(task_data.judgement_criteria),
                    hints: JSON.stringify(task_data.hints),
                    plan_exceptions: JSON.stringify(task_data.plan_exceptions)
                };

                // Collect files
                pre_params.file_names = pre_params.file_names || [];
                let promises = [];
                let files_inputs = $("#files_section input[type='file']");
                for (let i = 0; i < files_inputs.length; i++) {
                    let formData = new FormData();
                    let files = [];
                    for (let file_num = 0; file_num < files_inputs[i].files.length; file_num++) {
                        formData.append("files_to_upload", files_inputs[i].files[file_num]);
                    }
                    //formData.append("files_to_upload", files_inputs[i].files);
                    promises.push($http.post("/api/uploads/upload", formData, {
                        //headers: {enctype:'multipart/form-data'}
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined, enctype: 'multipart/form-data'}
                    }));
                }
                Promise.all(promises).then((responses) => {
                    // All files are uploaded
                    // Get file names
                    for (let i = 0; i < responses.length; i++) {
                        let response = responses[i].data.data;
                        pre_params.file_names.push.apply(pre_params.file_names, response);
                    }
                    pre_params.file_names = JSON.stringify(pre_params.file_names);

                    let params = $.param(pre_params);
                    _$http({
                        method: "POST",
                        url: "/api/tasks/modify/" + task_data._id,
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
                });
            };

            _$scope.reorder_task = (task_id, new_inner_topic_order) => {
                let params = $.param({
                    inner_topic_order: new_inner_topic_order
                });
                _$http({
                    method: "POST",
                    url: "/api/tasks/modify/" + task_id,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success("task successfully archived.");
                    _$scope.get_all_tasks();
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            _$scope.change_task_topic = (task_id, new_topic_name) => {
                let params = $.param({
                    topic_name: new_topic_name
                });
                _$http({
                    method: "POST",
                    url: "/api/tasks/modify/" + task_id,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success("task successfully activated.");
                    _$scope.get_all_tasks();
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            _$scope.remove_file_from_task = (task_data, filename) => {
                let params = $.param({
                    file_names: JSON.stringify([filename])
                });
                _$http({
                    method: "POST",
                    url: "/api/uploads/delete",
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success(response.message);

                    // Update task
                    task_data.file_names = task_data.file_names.filter((elem) => elem !== filename);
                    params = $.param({
                        file_names: JSON.stringify(task_data.file_names)
                    });
                    _$http({
                        method: "POST",
                        url: "/api/tasks/modify/" + task_data._id,
                        data: params,
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                    }).then((response) => {
                        alertify.success("Task successfully updated.");
                    }, (response) => {
                        response = response.data;
                        alertify.error(response.message);
                    });

                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            _$scope.delete_task = (task_id, task_title) => {
                _modals.create_new_confirmation_modal("delete_confirm_modal",
                    "Delete Task " + task_title,
                    "After deleting this task, users on this task will be removed from it, files related to this task will be erase from the server and no traces of solutions (from user who completed this task) will remain.",
                    "delete task " + task_title, (ans) => {
                        if (ans) {
                            _$http({
                                method: "POST",
                                url: "/api/tasks/remove/" + task_id,
                                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                            }).then((response) => {
                                response = response.data;
                                alertify.success(response.message);
                                _$scope.get_all_tasks();
                            }, (response) => {
                                response = response.data;
                                alertify.error(response.message);
                            });
                        } else {
                            alertify.success("Task is here to stay!");
                        }
                    }
                );
            };
        };

        this.get_task_details = (task_id) => {
            let deferred = $.Deferred();
            _$http({
                method: "GET",
                url: "/api/tasks/t" + task_id,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then((response) => {
                response = response.data;
                alertify.success(response.message);
                _$scope.topic_data = response.data[0];
                deferred.resolve(_$scope.topic_data);
            }, (response) => {
                response = response.data;
                alertify.error(response.message);
                deferred.reject(response.message);
            });
            return deferred.promise();
        }
    });