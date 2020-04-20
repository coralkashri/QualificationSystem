angular.element(document).ready(() => {
    init_materialize();
});

const app = angular.module('global_app', ['ngSanitize', 'ngAnimate', 'loaderM', 'timersM', 'plansM', 'usersM',
    'topicsM', 'filesM', 'aceM'])

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

        $scope.restore_code_section = editor => {
            let current_data = $scope.task_details.code_sections[$scope.task_details.code_sections.length - 1];
            editor.setTheme(current_data.theme);
            editor.session.setMode(current_data.language);
            editor.setOptions({
                readOnly: true
            });
        };

        $scope.create_answer_code_section = editor => {
            let answer_md = $scope.task_details.answer_code_compilation_data; // TODO
            editor.setTheme(answer_md.theme);
            editor.session.setMode(answer_md.language);
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
                if ($scope.task_details.answer_type === "MULTIPLE_CHOICES") {
                    $scope.learner_answer = [];
                }
                if ($scope.task_details.topic_id) {
                    $scope.get_topic_by_id($scope.task_details.topic_id);
                }
            });

            // Override users.submit_task
            $scope.submit_task = (task_details, learner_answer) => {
                users_s.submit_task(task_details, learner_answer, username, plan_name);
            };

            // TODO restore user answer
        };
    });