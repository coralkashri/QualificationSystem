angular.element(document).ready(() => {
    init_materialize();
});

const app = angular.module('global_app', ['ngSanitize', 'ngAnimate', 'loaderM', 'timersM', 'plansM', 'usersM',
    'topicsM', 'filesM'])

    .controller('body_controller', ($scope, $http, $window, $timeout, $sce, preloader, plans_s, users_s, topics_s,
                                    files_s, timers_manager_s, dark_area) => {
        ng_init_sidenav(dark_area);
        timers_manager_s.init($scope, $http, $timeout, preloader);
        plans_s.init($scope, $http, timers_manager_s, preloader);
        topics_s.init($scope, $http, timers_manager_s, preloader);
        users_s.init($scope, $http, timers_manager_s, preloader);
        files_s.init($scope, $http, $sce, timers_manager_s, preloader);

        $scope.Math = window.Math;
        $scope.get_css_property = (property, value) => {
            let ret_val = {};
            ret_val[property] = value;
            return ret_val;
        };

        $scope.get_next_hint = () => {
            let visible_hints_count = $scope.task_details.visible_hints.length;
            if (visible_hints_count < $scope.task_details.hints.length) {
                $scope.task_details.visible_hints.push($scope.task_details.hints[visible_hints_count])
            }
        };

        $scope.init_page = (username, plan_name) => {
            $scope.get_plan_progress(username, plan_name).done(() => {
                $timeout(() => {
                    $(".progress-bar > span").each(function () {
                        $(this)
                            .data("origWidth", $(this).width())
                            .width(0)
                            .animate({
                                width: $(this).data("origWidth")
                            }, 1200);
                    });
                    let gallery = $("#gallery");
                    gallery.justifiedGallery({
                        border: 6
                    }).on('jg.complete', function() {
                        gallery.lightGallery({
                            thumbnail: true
                        });
                    });
                }, 500);
            });

            $scope.get_user_current_task(username, plan_name).done(() => {
                $scope.task_details.visible_hints = [];
                $scope.get_topic_by_id($scope.task_details.topic_id);
            });

            // TODO restore user answer
        };

        $scope.submit_task = _ => {

        };



    });