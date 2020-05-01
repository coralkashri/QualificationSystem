angular.module("globalDataM", [])

    .service("users_roles_s", function() {

        let _$scope;
        let role_names = ["Banned", "User", "Manger", "Admin"];

        this.init = ($scope) => {
            _$scope = $scope;

            _$scope.get_role_name = (role_number) => {
                return role_names[role_number];
            };
        };
    });