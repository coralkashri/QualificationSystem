angular.module("versionsM", [])
    .service("versions_s", function () {
        this.init = ($scope, $http, modals_s, timers_manager_s) => {
            $scope.new_version = () => {
                let new_version_id = $scope.new_version_version_id;
                let prev_version_id =    $scope.new_version_prev_version_id
                                      || $scope.last_version && $scope.last_version.version
                                      || "None";

                let route = "/api/versions/add/v" + new_version_id;
                let params = $.param({
                    prev_version_id: prev_version_id,
                    is_beta: !!$scope.new_version_beta,
                    details: $scope.new_version_version_details,
                    downloader: $scope.new_version_version_downloader,
                    release_date: new Date($scope.new_version_version_release_date),
                    known_issues: $scope.new_version_version_known_issues
                });

                if ($scope.new_version_version_downloader === "Invalid input") {
                    alertify.error("Invalid new version release date.");
                    return false;
                }

                $http({
                    method: "POST",
                    url: route,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success(response.message);
                    $scope.clear_new_version_data();
                    $scope.clear_and_close_search();
                    scroll_to_top();
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            $scope.clear_new_version_data = () => {
                $scope.new_version_version_id = $scope.new_version_prev_version_id = $scope.new_version_version_details =
                    $scope.new_version_version_downloader = $scope.new_version_version_known_issues = "";

                $("input")
                    .filter(function() {
                        return this.id.match(/new_version*/) && !this.placeholder;
                    }).each(function() {
                        $(this).labels().removeClass("active");
                    }
                );
                document.getElementById("new_version_version_release_date").valueAsDate = new Date(new Date() + " EDT");
                $scope.versions_table_conf.update_lock = false;
            };

            $scope.remove_version = (version_id) => {
                modals_s.create_new_confirmation_modal("delete_confirm_modal",
                    "Delete version " + version_id,
                    "After deleting this version, all features and properties will be deleted as well.",
                    "delete version " + version_id, (ans) => {
                        if (ans) {
                            $http({
                                method: "POST",
                                url: "/api/versions/remove/v" + version_id,
                                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                            }).then((response) => {
                                response = response.data;
                                alertify.success(response.message);
                                $scope.clear_and_close_search();
                            }, (response) => {
                                response = response.data;
                                alertify.error(response.message);
                            });
                        } else {
                            alertify.success("Version is here to stay!");
                        }
                    });
            };

            $scope.modify_version_view_state = (version_data, state) => {
                $scope.versions_filter_type_select_model = "ver";
                $("#reports_type_filter_select").val($scope.versions_filter_type_select_model);
                $('select').formSelect();
                let version_id = version_data.version;
                $scope.versions_table_conf.version_update_lock = !state;
                $scope.version_data_filter_model = state ? "" : version_id;
                $scope.version_edit_progress = {
                    is_active: !state,
                    version: state || version_id
                };
                let version_details_field = $("[id='modify_version_details_" + version_id + "']"),
                    is_beta_field = $("[id='modify_version_beta_" + version_id + "']"),
                    downloader_field = $("[id='modify_version_downloader_" + version_id + "']"),
                    release_date_field = $("[id='modify_version_release_date_" + version_id + "']"),
                    known_issues_field = $("[id='modify_version_known_issues_" + version_id + "']"),
                    prev_version_field = $("[id='modify_version_from_" + version_id + "']"),
                    version_id_field = $("[id='modify_version_version_id_" + version_id + "']");

                // Prev Version
                prev_version_field.val(version_data.prev_version);
                // Version ID
                version_id_field.val(version_data.version);
                // Beta field
                is_beta_field.prop("checked", version_data.is_beta);
                // Version Details
                version_details_field.val(version_data.details);
                // Downloader
                downloader_field.val(version_data.downloader);

                // Release Date
                let date_info = version_data.release_date.split("-");
                date_info[1] = date_info[1] <= '9' ? '0' + date_info[1] : date_info[1];
                date_info[0] = date_info[0] <= '9' ? '0' + date_info[0] : date_info[0];
                document.getElementById(release_date_field.attr("id")).valueAsDate = new Date(date_info[1] + '/' + date_info[0] + '/' + date_info[2] + " EDT");

                release_date_field.trigger("change");
                // Known Issues
                known_issues_field.val(version_data.known_issues);

                if (version_data.details)
                    version_details_field.labels().addClass("active"); // Read About: Materialize input labels active class - https://materializecss.com/text-inputs.html
                if (version_data.downloader)
                    downloader_field.labels().addClass("active");
                if (version_data.known_issues)
                    known_issues_field.labels().addClass("active");
                release_date_field.labels().addClass("active");
                prev_version_field.labels().addClass("active");
                version_id_field.labels().addClass("active");
                version_data.view_state = state;
            };

            $scope.modify_version = (version_data) => {
                let version_id = version_data.version;
                let version_details_field   = $("[id='modify_version_details_" + version_id + "']"),
                    downloader_field   = $("[id='modify_version_downloader_" + version_id + "']"),
                    release_date_field = $("[id='modify_version_release_date_" + version_id + "']"),
                    known_issues_field  = $("[id='modify_version_known_issues_" + version_id + "']"),
                    is_beta_field  = $("[id='modify_version_beta_" + version_id + "']"),
                    prev_version_field  = $("[id='modify_version_from_" + version_id + "']"),
                    version_id_field  = $("[id='modify_version_version_id_" + version_id + "']");

                let new_version_id = version_id_field.val();

                let params = $.param({
                    version_id: new_version_id,
                    prev_version: prev_version_field.val(),
                    is_beta: !!is_beta_field.is(':checked'),
                    details: version_details_field.val(),
                    downloader: downloader_field.val(),
                    release_date: new Date(release_date_field.val() + " EDT"),
                    known_issues: known_issues_field.val()
                });

                $http({
                    method: "POST",
                    url: "/api/versions/modify/v" + version_id,
                    data: params,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    alertify.success(response.message);
                    $scope.version_data_filter_model = new_version_id;
                    $scope.versions_table_conf.version_update_lock = false;
                    $scope.modify_version_view_state(version_data, true);
                    $scope.clear_and_close_search();
                }, (response) => {
                    response = response.data;
                    alertify.error(response.message);
                });
            };

            $scope.cancel_modify_version = (version_data) => {
                $scope.modify_version_view_state(version_data, true);
            };
        }
    });