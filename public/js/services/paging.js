angular.module("pagingM", [])
    .service("paging_s", function() {
        let _$scope;
        let _preloader;
        let _dark_area;

        this.init = ($scope, preloader, dark_area) => {
            _$scope = $scope;
            _preloader = preloader;
            _dark_area = dark_area;
            _$scope.versions_current_page = 1;
            _$scope.versions_pages_count = 1;

            _$scope.set_current_versions_page = (current_page) => {
                _$scope.versions_current_page = current_page;
            };

            _$scope.set_version_properties_page = (version_data, current_page) => {
                version_data.properties_current_page = current_page;
            };
        };

        this.update_versions_paging = (versions, current_page) => {
            _$scope.versions_pages_count = Math.ceil(versions.length / _$scope.num_versions_for_page_model);
            current_page = current_page > _$scope.versions_pages_count ? _$scope.versions_pages_count : current_page;
            _$scope.versions_current_page = current_page;
        };

        this.update_properties_paging = (version_data, properties, current_page) => {
            version_data.properties_pages_count = Math.ceil(properties.length / _$scope.num_properties_for_page_model);
            version_data.properties_current_page = current_page;
            /*$("[name='properties_paging_v" + version_data.version + "']").materializePagination({
                align: 'center',
                lastPage: version_data.properties_pages_count,
                firstPage:  1,
                useUrlParameter: false,
                currentPage: current_page,
                onClickCallback: function(requestedPage){
                    version_data.properties_current_page = requestedPage;
                    _preloader.start();
                    //scroll_to_top();
                }
            });*/
        };
    })

    .filter("versions_filter", ["paging_s", function(paging_s) {
        return function (versions_list, current_page, num_versions_for_page_model) {
            let filtered = [];
            if (versions_list === undefined) return filtered;
            filtered = versions_list;
            num_versions_for_page_model = Number(num_versions_for_page_model);
            current_page = current_page < 1 ? 1 : current_page;
            let begin = ((current_page - 1) * num_versions_for_page_model),
                end = begin + num_versions_for_page_model;
            if (begin > filtered.length) {
                current_page = 1;
                begin = 0;
            }
            paging_s.update_versions_paging(filtered, current_page);
            return filtered.slice(begin, Math.min(end, filtered.length));
        };
    }])

    .filter("properties_filter", ["paging_s", function(paging_s) {
        return function (properties, version_data, current_page, num_properties_for_page_model) {
            let filtered = [];
            if (properties === undefined) return filtered;
            filtered = properties;
            num_properties_for_page_model = Number(num_properties_for_page_model);
            current_page = current_page < 1 ? 1 : current_page;
            let begin = ((current_page - 1) * num_properties_for_page_model),
                end = begin + num_properties_for_page_model;
            if (begin > filtered.length) {
                current_page = 1;
                begin = 0;
            }
            paging_s.update_properties_paging(version_data, filtered, current_page);
            return filtered.slice(begin, Math.min(end, filtered.length));
        };
    }])

    .filter("range_filter", ["paging_s", function(paging_s) {
        return function(input, current, total) {
            total = parseInt(total);
            current = parseInt(current);
            let max_visible_pages = 3;

            let is_prev_ellipsis, is_next_ellipsis;
            is_prev_ellipsis = is_next_ellipsis = false;

            for (var i = 0; i < total; i++) {
                if (i === 0 || i === total - 1) {
                    input.push(i + 1);
                } else if (i + 1 <= current + max_visible_pages / 2) {
                    if (i + 1 >= current - max_visible_pages / 2) {
                        input.push(i + 1);
                    } else {
                        if (!is_prev_ellipsis) {
                            is_prev_ellipsis = true;
                            input.push(-1);
                        }
                    }
                } else {
                    if (!is_next_ellipsis) {
                        is_next_ellipsis = true;
                        input.push(-2);
                    }
                }
            }

            return input;
        };
    }]);