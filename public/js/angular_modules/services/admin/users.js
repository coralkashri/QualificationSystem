angular.module("adminUsersM", [])

    .service("admin_users_s", function() {
        let _$scope, _$http, _preloader;
        let role_names = ["Banned", "User", "Manger", "Admin"];

        this.init = ($scope, $http, preloader) => {
            _$scope = $scope;
            _$http = $http;
            _preloader = preloader;

            _$scope.get_all_users = () => {
                _preloader.start();
                _$http({
                    method: "GET",
                    url: "/api/users/all",
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    let users_list = response.data;
                    users_list.sort((elem1, elem2) => {
                        if (elem1.role > elem2.role) return -1;
                        if (elem1.role < elem2.role) return 1;
                        return 0;
                    });
                    _$scope.users_list = users_list;
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                }).finally(() => {
                    _preloader.stop();
                });
            };

            _$scope.get_role_name = (role_number) => {
                return role_names[role_number];
            };

            _$scope.create_user = () => {
                let route = "/api/users/create";
                let params = $.param({
                    username: $("#username").val(),
                    password: $("#password").val(),
                    role: $("#user_role").val()
                });
                _$http({
                    method: "POST",
                    url: route,
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

            _$scope.modify_user = (username) => {
                let route = "/api/users/modify/" + username;
                let pre_params = {};
                let new_username = $("#username").val();
                let new_password = $("#password").val();
                let new_role = $("#user_role").val();
                if (new_username) pre_params.username = new_username;
                if (new_password) pre_params.password = new_password;
                if (new_role) pre_params.role = new_role;

                let params = $.param(pre_params);
                _$http({
                    method: "POST",
                    url: route,
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

            _$scope.delete_user = (username) => {
                let route = "/api/users/remove/" + username;
                _$http({
                    method: "POST",
                    url: route,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success(response.message);
                    _$scope.get_all_users();
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };
        };

        this.get_user_details = (username, success_cb, error_cb, cb) => {
            _preloader.start();
            _$http({
                method: "GET",
                url: "/api/users/u" + username,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then((response) => {
                response = response.data;
                _$scope.user_data = response.data[0];
                success_cb && success_cb(_$scope.user_data);
            }, (response) => {
                response = response.data;
                alertify.error(response.message);
                error_cb && error_cb();
            }).finally(() => {
                _preloader.stop();
                cb && cb();
            });
        };
    });