angular.module("versionsPropertiesM", [])
    .service("properties_s", function () {
        this.init = ($scope, $http) => {
            $scope.change_new_property = (version_id) => {
                let current_desc = $("[id='new_version_property_description_" + version_id + "']").val();
                let current_tests_details = $("[id='new_version_property_tests_details_" + version_id + "']").val();
                let current_known_issues = $("[id='new_version_property_known_issues_" + version_id + "']").val();
                $scope.versions_table_conf.properties_update_lock = !!current_desc.length || !!current_tests_details.length || !!current_known_issues.length;
            };

            $scope.new_property = (version_id) => {
                let description = $("[id='new_version_property_description_" + version_id + "'").val();
                let params = $.param({
                    type: $("[id='new_version_property_type_" + version_id + "'").val(),
                    description: description,
                    tests_scope: $("[id='new_version_property_tests_scope_" + version_id + "'").val(),
                    tests_details: $("[id='new_version_property_tests_details_" + version_id + "'").val(),
                    known_issues: $("[id='new_version_property_known_issues_" + version_id + "'").val()
                });

                $scope.versions_table_conf.properties_update_lock = false;

                if (!description) {
                    alertify.error("Please enter description: " + version_id);
                    return false;
                }

                $http({
                    method: "POST",
                    url: "/api/versions/add/p" + version_id,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success(response.message);
                    $scope.search(true, true);
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            $scope.modify_property = (version_id, property_id) => {
                let type_field          = $("[id='modify_property_type_" + property_id + "']"),
                    description_field   = $("[id='modify_property_description_" + property_id + "']"),
                    tests_scope_field   = $("[id='modify_property_tests_scope_" + property_id + "']"),
                    tests_details_field = $("[id='modify_property_tests_details_" + property_id + "']"),
                    known_issues_field  = $("[id='modify_property_known_issues_" + property_id + "']");

                let params = $.param({
                    type: type_field.val(),
                    description: description_field.val(),
                    tests_scope: tests_scope_field.val(),
                    tests_details: tests_details_field.val(),
                    known_issues: known_issues_field.val()
                });

                if (!description_field.val()) {
                    alertify.error("Please enter description: " + version_id);
                    return false;
                }

                $http({
                    method: "POST",
                    url: "/api/versions/modify/p" + version_id + "-" + property_id,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success(response.message);
                    $scope.search(true, true);
                    $scope.versions_table_conf.properties_update_lock = false;
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            $scope.modify_property_view_state = (property_data, state) => {
                $scope.versions_table_conf.properties_update_lock = !state;
                let property_id = property_data._id;
                let type_field          = $("[id='modify_property_type_" + property_id + "']"),
                    description_field   = $("[id='modify_property_description_" + property_id + "']"),
                    tests_scope_field   = $("[id='modify_property_tests_scope_" + property_id + "']"),
                    tests_details_field = $("[id='modify_property_tests_details_" + property_id + "']"),
                    known_issues_field  = $("[id='modify_property_known_issues_" + property_id + "']");

                type_field.val(property_data.type);
                description_field.val(property_data.description);
                tests_scope_field.val(property_data.tests_scope);
                tests_details_field.val(property_data.tests_details);
                known_issues_field.val(property_data.known_issues);

                type_field.formSelect();
                tests_scope_field.formSelect();
                description_field.labels().addClass("active"); // Read About: Materialize input labels active class - https://materializecss.com/text-inputs.html
                tests_details_field.labels().addClass("active");
                known_issues_field.labels().addClass("active");

                property_data.view_state = state;
            };

            $scope.remove_property = (version_id, property_id) => {
                $http({
                    method: "POST",
                    url: "/api/versions/remove/p" + version_id + "-" + property_id,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success(response.message);
                    $scope.search(true, true);
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };
        }
    });