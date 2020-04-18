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
    });