angular.module("searchM", [])
    .service("versions_search_s", function() {
        let _$scope, _$http, _timers_pool, _preloader;
        let search_container = $(".search-container");
        let search_status = "close"; // ["close", "open-quick", "open-full"]
        let is_search_active = false;
        let init_scope_functions;

        this.init = ($scope, $http, timers_manager_s, preloader) => {
            _$http = $http;
            _$scope = $scope;
            _preloader = preloader;
            _timers_pool = timers_manager_s;
            init_scope_functions();
        };

        this.update_last_version = () => {
            _$http({
                method: "GET",
                url: "/api/versions/all",
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then((response) => {
                response = response.data;
                let versions_list = response.data;
                versions_list.sort((elem1, elem2) => {
                    if (elem1.version > elem2.version) return -1;
                    if (elem1.version < elem2.version) return 1;
                    return 0;
                });
                _$scope.last_version = versions_list[0];
            }, (response) => {
                response = response.data;
                alertify.error(response.message);
            });
        };

        this.close_advanced_search_modal = _ => {
            _$scope.advanced_search.cancel();
        };

        init_scope_functions = _ => {
            _$scope.search = (force_update, single_search, advanced_search_params) => {
                // Cancel table animation for some data
                function cancel_table_animation() {
                    let versions_table = $("#versions_table");
                    versions_table.removeClass('animated');
                }

                function apply_table_animation() {
                    let versions_table = $("#versions_table");
                    versions_table.addClass('animated');
                }

                function cancel_edit_state() {
                    if (!_$scope.versions_table_conf.version_update_lock && !_$scope.versions_table_conf.properties_update_lock) {
                        _$scope.version_edit_progress = {
                            is_active: false,
                            version: ""
                        };
                    }
                }

                function make_readable_date(unreadable_date) {
                    let date_info = unreadable_date.split('T');
                    let date = new Date(date_info[0] + " EDT");
                    let splitter = '-';
                    return date.getDate() + splitter + (date.getMonth() + 1) + splitter + date.getFullYear();
                }

                function update_new_versions_list_properties(v_list) {
                    v_list.forEach((version) => {
                        version.release_date = make_readable_date(version.release_date);
                        version.view_state = true;
                        version.properties_current_page = 1;
                        version.properties.forEach((property) => {
                            property.view_state = true;
                        });
                    });
                }

                function is_table_update_enable(force_update, new_versions_list) {
                    // Is there is an active edit lock by the user
                    let not_updating_state = !_$scope.versions_table_conf.version_update_lock && !_$scope.versions_table_conf.properties_update_lock;

                    // Is there is any detected change between the current list and the new list?
                    let change_detected = !_$scope.versions_list || new_versions_list.length !== _$scope.versions_list.length ||
                        (new_versions_list && new_versions_list.length && new_versions_list[0].version !== _$scope.versions_list[0].version);

                    return force_update || not_updating_state && change_detected;
                }

                function splitMulti(str, tokens) {
                    var tempChar = tokens[0]; // We can use the first token as a temporary join character
                    for (var i = 1; i < tokens.length; i++) {
                        str = str.split(tokens[i]).join(tempChar);
                    }
                    str = str.split(tempChar);
                    return str;
                }

                function mark() {

                    // Read the keyword
                    let keyword = _$scope.version_data_filter_model;

                    // Determine selected options
                    let options = {
                        separateWordSearch: true,
                        diacritics: true,
                        accuracy: "partially"
                        //accuracy: ["complementary", "partially", "exactly"]
                    };

                    // Remove previous marked elements and mark
                    // the new keyword inside the context
                    $("#page_content").unmark({
                        done: function () {
                            $("#page_content").mark(keyword, options);
                        }
                    });
                }

                /**
                 * If ver1 is bigger => Returns -1
                 * If ver2 is bigger => Returns 1
                 * If the versions are equals => Returns 0
                 *
                 * Note: Working the same way with dates in format: yyyy-mm-dd
                 *
                 * @param ver1
                 * @param ver2
                 * @returns 1/-1/0
                 */
                function compare_two_versions(ver1, ver2) {
                    let ver1_data = splitMulti(ver1.version, ['.', '-', 'T', ':', 'Z']);
                    let ver2_data = splitMulti(ver2.version, ['.', '-', 'T', ':', 'Z']);
                    let min_length = Math.min(ver1_data.length, ver2_data.length);
                    let max_length = Math.max(ver1_data.length, ver2_data.length);
                    let i;
                    for (i = 0; i < min_length; i++) {
                        if (Number(ver1_data[i]) > Number(ver2_data[i])) {
                            return -1;
                        } else if (Number(ver1_data[i]) < Number(ver2_data[i])) {
                            return 1;
                        }
                    }

                    if (min_length !== max_length) {
                        let data_to_check;
                        let suspect_sign;
                        if (ver1_data.length === max_length) {
                            data_to_check = ver1_data;
                            suspect_sign = -1;
                        } else {
                            data_to_check = ver2_data;
                            suspect_sign = 1;
                        }
                        for (i; i < max_length; i++) {
                            if (Number(data_to_check[i]) !== 0) return suspect_sign;
                        }
                    }

                    return 0;
                }

                function sort_versions_list_by_version(versions_list) {
                    versions_list.sort(compare_two_versions);
                }

                let route;
                switch (_$scope.versions_filter_select_model) {
                    case "equal":
                        route = "/api/versions/";
                        break;

                    case "after":
                        route = "/api/versions/gt_";
                        break;

                    case "before":
                        route = "/api/versions/lt_";
                        break;
                }
                let deferred = $.Deferred();

                if (_$scope.version_data_filter_model) {
                    let data;
                    switch (_$scope.versions_filter_type_select_model) {
                        case "ver":
                            route += "v";
                            data = _$scope.version_data_filter_model;
                            break;

                        case "desc":
                            route += "desc-";
                            data = _$scope.version_data_filter_model;
                            break;

                        case "date":
                            alertify.error("Error occurred in client side: Date filter detected but didn't applied correctly.");
                            break;
                    }
                    route += data;
                } else if ($("#filter_version_release_date").val()) {
                    route += "d";
                    route += new Date($("#filter_version_release_date").val() + "EDT");
                    //let extracted_date_data = date_data.split(['-', '/', '.', ' ']);
                    //let formatted_date = extracted_date_data// yyyy-mm-dd
                } else {
                    route = "/api/versions/all";
                }
                if (route !== "/api/versions/all")
                    is_search_active = true;

                if (force_update) {
                    _preloader.start();
                }

                let new_versions_list;
                _$http({
                    method: "GET",
                    url: route,
                    params: advanced_search_params || {},
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).then((response) => {
                    response = response.data;
                    cancel_table_animation();
                    new_versions_list = response.data;
                    cancel_edit_state();
                    update_new_versions_list_properties(new_versions_list);
                    if (_$scope.versions_filter_type_select_model !== "desc" || !_$scope.version_data_filter_model) {
                        // Sort by version
                        sort_versions_list_by_version(new_versions_list);
                    }
                    if (is_table_update_enable(force_update, new_versions_list)) {
                        apply_table_animation();
                        _$scope.versions_list = new_versions_list;
                        alertify.success(response.message);
                    }
                    if (_$scope.versions_filter_type_select_model === "desc" && _$scope.version_data_filter_model) {
                        _timers_pool.add_timer("marker", mark, 500);
                        _timers_pool.start_timer("marker");
                    }
                }, (response) => {
                    let msg;
                    if (response.data) {
                        response = response.data;
                        msg = response.message;
                    } else {
                        msg = "Connection error";
                    }
                    alertify.error(msg);
                }).finally(() => {
                    _preloader.stop();
                    let is_timer_exists = _timers_pool.is_exists("versions_search");
                    let is_timer_running = _timers_pool.is_timer_running("versions_search");
                    if (!single_search && (!is_timer_exists || is_timer_running)) {
                        if (!is_timer_exists) _timers_pool.add_timer("versions_search", _ => _$scope.search(), 2000);
                        _timers_pool.start_timer("versions_search");
                    }

                    deferred.resolve("Search ended");
                    /* To wait to finally state, use:
                    $scope.search()
                    .done(
                        after_search.bind(null, param1, param2, ...)
                    );*/
                });
                return deferred.promise();
            };

            _$scope.clear_and_close_search = () => {
                _$scope.clear_search();
                _$scope.close_search();
            };

            _$scope.clear_search = () => {
                _$scope.version_data_filter_model = "";
                _$scope.version_date_data_filter_model = "";
                let version_rel_date_filter = $("#filter_version_release_date");
                version_rel_date_filter.val("");
                version_rel_date_filter.trigger("change");
                _$scope.search(false, true);
                let search_status_data = search_status.split('-');
                if (search_status_data[0] === "open") {
                    search_container.addClass("full-search-btn-container");
                    search_container.removeClass("apply-search-container");
                }
                if (search_status === "close" || search_status_data[0] === "open" && search_status_data[1] !== "full") {
                    _timers_pool.start_timer("versions_search");
                }
                is_search_active = false;
            };

            _$scope.close_search = () => {
                search_container.removeClass("full-search-btn-container apply-search-container");
                search_status = "close";
            };

            _$scope.open_search = type => {
                switch (type) {
                    case "quick":
                        if (search_status.split('-')[0] === "open") return;
                        search_container.addClass("full-search-btn-container");
                        search_container.removeClass("apply-search-container");
                        break;

                    case "full":
                        _timers_pool.pause_timer("versions_search");
                        $('#advanced_search_version_modal').modal('open');
                        break;
                }
                search_status = "open-" + type;
                _$scope.update_quick_full_search_btn();
            };

            _$scope.update_quick_full_search_btn = _ => {
                if (search_status === "close") return;
                switch (_$scope.versions_filter_type_select_model) {
                    case "ver":
                    case "desc":
                        if (_$scope.version_data_filter_model) {
                            search_container.removeClass("full-search-btn-container");
                            search_container.addClass("apply-search-container");
                            _timers_pool.pause_timer("versions_search");
                        } else {
                            search_container.addClass("full-search-btn-container");
                            search_container.removeClass("apply-search-container");
                        }
                        break;

                    case "date":
                        search_container.removeClass("full-search-btn-container");
                        search_container.addClass("apply-search-container");
                        _timers_pool.pause_timer("versions_search");
                        break;
                }
            };

            _$scope.change_data_input_type = (trigger_src, new_type) => {
                _timers_pool.add_timer("change_data_input_type", _ => {
                    _$scope.versions_filter_type_select_model = new_type = new_type || _$scope.versions_filter_type_select_model;
                    $("#reports_type_filter_select").val(new_type);
                    let advances_search_tabs_elem = $('#advanced_search_version_modal .tabs');
                    switch (new_type) {
                        case "ver":
                        case "desc":
                            if (trigger_src !== "tabs_click") {
                                if (new_type === "ver") advances_search_tabs_elem.tabs("select", "advanced_search_by_version");
                                else advances_search_tabs_elem.tabs("select", "advanced_search_by_description");
                            }
                            _$scope.versions_filter_select_model = "equal";
                            _$scope.update_quick_search_toolbox_filter_select("version", _$scope.versions_filter_select_model);
                            break;

                        case "date":
                            if (trigger_src !== "tabs_click") {
                                advances_search_tabs_elem.tabs("select", "advanced_search_by_date");
                            }
                            _$scope.versions_filter_select_model = "before";
                            _$scope.update_quick_search_toolbox_filter_select("date", _$scope.versions_filter_select_model);
                            break;
                    }
                    advances_search_tabs_elem.tabs("updateTabIndicator");
                    _$scope.clear_search();
                    _$scope.update_quick_full_search_btn();
                }, 0);
                _timers_pool.start_timer("change_data_input_type");
            };

            _$scope.update_quick_search_toolbox_filter_select = (type, val) => {
                let select_elem;
                if (type === "version") {
                    select_elem = $("#versions_version_type_filter_select"); // should auto update
                } else if (type === "date") {
                    select_elem = $("#versions_date_type_filter_select"); // should auto update
                } else { // Both
                    select_elem = $("#versions_version_type_filter_select, #versions_date_type_filter_select");
                }
                select_elem.val(val);
                $('select').formSelect();
            };

            _$scope.search_version = (version_id) => {
                _$scope.versions_filter_type_select_model = 'ver';
                _$scope.version_data_filter_model = version_id;
                _$scope.versions_filter_select_model = "equal";
                _$scope.open_search("quick");
                _$scope.update_quick_full_search_btn();
                _$scope.search(false, true);
                scroll_to_top();
            };

            _$scope.advanced_search = {
                init: function() {
                    this.description.parent = this;
                },
                params: {
                    available_params: type => {
                        switch (type) {
                            case "desc":
                                return [
                                    'versions_details',
                                    'versions_downloaders',
                                    'versions_issues',
                                    'properties_types',
                                    'properties_descriptions',
                                    'properties_issues'
                                ].map(i => "description." + i);

                            default:
                                return [];
                        }
                    },
                    get_param_value: param => {
                        let parts = param.split('.');
                        let current_param = _$scope.advanced_search;
                        parts.forEach((part) => {
                            current_param = current_param[part];
                        });
                        return current_param;
                    },
                    get_param_parent: param => {
                        let parts = param.split('.');
                        parts.pop();
                        let current_param = _$scope.advanced_search;
                        parts.forEach((part) => {
                            current_param = current_param[part];
                        });
                        return current_param;
                    },
                    get_param_name: param => {
                        let parts = param.split('.');
                        return parts[parts.length - 1];
                    }
                },
                cancel: _ => {
                    if (!is_search_active) {
                        _$scope.clear_search();
                        _$scope.close_search();
                        _timers_pool.start_timer("versions_search");
                    }
                    _$scope.update_quick_full_search_btn();
                },
                apply: function() {
                    is_search_active = true;
                    let params = {};

                    this.params.available_params(_$scope.versions_filter_type_select_model).forEach((param) => {
                        let current_param = this.params.get_param_value(param);
                        if (current_param.checkbox)
                            params[this.params.get_param_name(param)] = current_param.slider;
                    });

                    _$scope.open_search("quick");
                    _$scope.search(true, true, params);
                },
                description: {
                    init_models: function() {
                        this.parent.params.available_params("desc").forEach((param) => {
                            let current_params_root = this.parent.params.get_param_parent(param);
                            current_params_root[this.parent.params.get_param_name(param)] = {
                                checkbox: false,
                                slider: 0
                            };
                        });
                    },
                    select_all: function() {
                        //$("#advanced_search_by_description input[type='checkbox']").prop('checked', true);
                        this.parent.params.available_params(_$scope.versions_filter_type_select_model).forEach((param) => {
                            let current_param = this.parent.params.get_param_value(param);
                            current_param.checkbox = true;
                            this.update_sliders(true, "search_in_" + this.parent.params.get_param_name(param) + "_slider");
                        });
                    },
                    deselect_all: function() {
                        this.parent.params.available_params(_$scope.versions_filter_type_select_model).forEach((param) => {
                            let current_param = this.parent.params.get_param_value(param);
                            current_param.checkbox = false;
                            this.update_sliders(false, "search_in_" + this.parent.params.get_param_name(param) + "_slider");
                        });
                    },
                    set_weight: function(new_wight, set_to_all) {
                        this.parent.params.available_params(_$scope.versions_filter_type_select_model).forEach((param) => {
                            let current_param = this.parent.params.get_param_value(param);
                            if (set_to_all || current_param.checkbox) {
                                let current_slider = $("#search_in_" + this.parent.params.get_param_name(param) + "_slider");
                                current_slider.val(new_wight);
                                current_param.slider = new_wight;
                                current_slider.trigger("input.custom");
                            }
                        });
                    },
                    reset_weight: function() {
                        this.set_weight(0, true);
                    },
                    equal_weight: function() {
                        let elements_count = 0;
                        let weight;
                        // elements_count = $("#advanced_search_by_description input[type='checkbox']:checked").length;
                        // For case that the checkbox have not updated yet.
                        this.parent.params.available_params(_$scope.versions_filter_type_select_model).forEach((param) => {
                            let current_param = this.parent.params.get_param_value(param);
                            if (current_param.checkbox) {
                                elements_count++;
                            }
                        });
                        weight = elements_count ? 1 / elements_count : 0;
                        weight = Math.floor(weight * 100) / 100;
                        this.reset_weight();
                        this.set_weight(weight, false)
                    },
                    update_sliders: (is_add, current_slider_id) => {
                        let sliders = $("#" + current_slider_id);
                        let availableTotal = 1;

                        sliders.each(function () {
                            if (!$(this).attr("slider_initialized")) $(this).range();
                            $(this).attr("slider_initialized", true);

                            function calculate_max() {
                                let total = 0;

                                let sliders = $(".active .special-slider");
                                sliders.each(function () {
                                    total += Number($(this).val());
                                });

                                return availableTotal - total; // New max
                            }

                            function update_sliders(max, sliders) {
                                // Update each slider
                                sliders.each(function () {
                                    let t = $(this), value = Number(t.val());
                                    t.attr("max", max + value);
                                    t.val(value);
                                });
                            }

                            $(this).off(".custom");
                            $(this).on("input.custom", _ => {
                                let sliders = $(".active .special-slider");
                                let max = calculate_max();
                                update_sliders(max, sliders.not(this))
                            });
                            $(this).on("change.custom", _ => {
                                let sliders = $(".active .special-slider");
                                let max = calculate_max();
                                update_sliders(max, sliders.not(this))
                            });
                            let sliders;
                            if (is_add) {
                                sliders = $(this);
                            } else {
                                $(this).val(0);
                                sliders = $(".active .special-slider");
                            }
                            let max = calculate_max();
                            update_sliders(max, sliders);
                        });
                    }
                }
            };
            _$scope.advanced_search.init();
            _$scope.advanced_search.description.init_models();
        };
    });