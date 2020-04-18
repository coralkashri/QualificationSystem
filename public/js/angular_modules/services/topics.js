angular.module("topicsM", [])

    .service("topics_s", function() {
        let _$scope, _$http, _timers_manager, _preloader;

        this.init = ($scope, $http, timers_manager, preloader) => {
            _$http = $http;
            _$scope = $scope;
            _timers_manager = timers_manager;
            _preloader = preloader;

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
        }
    });