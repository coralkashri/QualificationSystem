angular.module("adminTopicsM", [])

    .service("admin_topics_s", function() {
        let _$scope, _$http, _timers_manager, _modals, _preloader;

        this.init = ($scope, $http, timers_manager, modals_manager, preloader) => {
            _$http = $http;
            _$scope = $scope;
            _timers_manager = timers_manager;
            _preloader = preloader;
            _modals = modals_manager;

            $scope.get_all_topics = () => {
                let deferred = $.Deferred();
                _preloader.start();

                _$http({
                    method: "GET",
                    url: "/api/topics",
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    let new_topics_list = response.data;
                    if (_$scope.topics_list) {
                        _$scope.topics_list.splice(0, _$scope.topics_list.length); // Clear this array
                        timers_manager.add_timer("update_topics_list", _ => {
                            for (let i = 0; i < new_topics_list.length; i++)
                                _$scope.topics_list.push(new_topics_list[i]);
                            _preloader.stop();
                        }, 650);
                        timers_manager.start_timer("update_topics_list");
                    } else {
                        _$scope.topics_list = new_topics_list;
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

            $scope.get_topic_by_id = (topic_id) => {
                let deferred = $.Deferred();
                _preloader.start();

                _$http({
                    method: "GET",
                    url: "/api/topics/id" + topic_id,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success(response.message);
                    _$scope.topic_data = response.data[0];
                    deferred.resolve(_$scope.topic_data);
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                    deferred.reject("Failed");
                }).finally(() => {
                    _preloader.stop();
                });
                return deferred.promise();
            };
            
            _$scope.create_topic = (topic_data) => {
                let params = $.param({
                    description: topic_data.description,
                    dependencies: JSON.stringify(topic_data.get_dependencies_topics()),
                    active_status: !!topic_data.is_active
                });
                _$http({
                    method: "POST",
                    url: "/api/topics/create/" + topic_data.name,
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

            _$scope.modify_topic = (target_topic_name, topic_data) => {
                let params = $.param({
                    new_topic_name: topic_data.name,
                    new_topic_description: topic_data.description,
                    new_topic_dependencies: JSON.stringify(topic_data.get_dependencies_topics()),
                    new_topic_active_status: !!topic_data.is_active
                });
                _$http({
                    method: "POST",
                    url: "/api/topics/modify/" + target_topic_name,
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

            _$scope.archive_topic = (topic_name) => {
                let params = $.param({
                    new_topic_active_status: false
                });
                _$http({
                    method: "POST",
                    url: "/api/topics/modify/" + topic_name,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success("Topic successfully archived.");
                    _$scope.get_all_topics();
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            _$scope.reactivate_topic = (topic_name) => {
                let params = $.param({
                    new_topic_active_status: true
                });
                _$http({
                    method: "POST",
                    url: "/api/topics/modify/" + topic_name,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success("Topic successfully activated.");
                    _$scope.get_all_topics();
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            _$scope.delete_topic = (topic_name) => {
                _modals.create_new_confirmation_modal("delete_confirm_modal",
                    "Delete topic " + topic_name,
                    "After deleting this topic, all topic's tasks will be deleted forever, and users on this topic will be removed from all of it's tasks." +
                    "Answers related to this topic won't be save, and no review of tasks related to this topic will be able to restore.",
                    "delete topic " + topic_name, (ans) => {
                        if (ans) {
                            _$http({
                                method: "POST",
                                url: "/api/topics/remove/" + topic_name,
                                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                            }).then((response) => {
                                response = response.data;
                                alertify.success(response.message);
                                _$scope.get_all_topics();
                            }, (response) => {
                                response = response.data;
                                alertify.error(response.message);
                            });
                        } else {
                            alertify.success("This topic is here to stay!");
                        }
                    });
            };
        };

        this.get_topic_details = (topic_name, success_cb, error_cb, cb) => {
            _$http({
                method: "GET",
                url: "/api/topics/t" + topic_name,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then((response) => {
                response = response.data;
                alertify.success(response.message);
                _$scope.topic_data = response.data[0];
                success_cb && success_cb(_$scope.topic_data);
            }, (response) => {
                response = response.data;
                alertify.error(response.message);
                error_cb && error_cb();
            }).finally(() => {
                cb && cb();
            });
        }
    });