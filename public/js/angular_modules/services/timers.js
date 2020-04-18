angular.module("timersM", [])

    .service("timers_manager_s", function() {
        let _$scope, _$http, _$timeout, _preloader;
        let timers = {};

        this.init = ($scope, $http, $timeout, preloader) => {
            _$http = $http;
            _$scope = $scope;
            _$timeout = $timeout;
            _preloader = preloader;
        };

        this.add_timer = (id, func, time) => {
            this.pause_timer(id);

            timers[id] = {
                is_running: false,
                is_ended: false,
                is_started: false,
                func: func,
                time: time,
                ref: null
            }
        };

        this.start_timer = (id) => {
            if (this.is_exists(id)) {
                //if (!timers[id].is_ended) {
                    this.pause_timer(id);
                //}

                timers[id].ref = _$timeout(() => {
                    timers[id].func();
                    timers[id].is_ended = true;
                }, timers[id].time);
                timers[id].is_running = true;
                timers[id].is_started = true;
            }
        };

        this.pause_timer = (id) => {
            if (this.is_exists(id) && timers[id].is_running) {
                _$timeout.cancel(timers[id].ref);
                timers[id].ref = null;
                timers[id].is_running = false;
                timers[id].is_ended = false;
                timers[id].is_started = false;
            }
        };

        this.is_exists = (id) => {
            return !!timers[id];
        };

        this.is_timer_running = (id) => {
            return this.is_exists(id) && timers[id].is_running;
        }
    });