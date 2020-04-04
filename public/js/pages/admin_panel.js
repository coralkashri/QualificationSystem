angular.element(document).ready(() => {
    init_materialize();
});

const app = angular.module('global_app', ['ngSanitize', 'ngAnimate', 'loaderM', 'timersM', 'modalsM', 'plansM', 'adminUsersM', 'adminPlansM', 'adminTopicsM'])

    .controller('body_controller', ($scope, $http, $window, $interval, $timeout, $location, preloader, dark_area,
                                    timers_manager_s, modals_s, plans_s, admin_users_s, admin_plans_s, admin_topics_s) => {
        ng_init_sidenav(dark_area);
        modals_s.init($scope, preloader, dark_area);
        timers_manager_s.init($scope, $http, $timeout, preloader);
        plans_s.init($scope, $http, timers_manager_s, preloader);
        admin_users_s.init($scope, $http, preloader);
        admin_plans_s.init($scope, $http, timers_manager_s, modals_s, preloader);
        admin_topics_s.init($scope, $http, timers_manager_s, modals_s, preloader);

        $scope.get_user_details = (username) => {
            admin_users_s.get_user_details(username, (data) => {
                $('#user_role').val(data.role);
                $('select').formSelect();
            })
        };

        /**
         * @override the one declared in plans_s
         */
        $scope.get_plan_details = (plan_name) => {
            plans_s.get_plan_details(plan_name, (data) => {
                $interval(() => {
                    $scope.original_plan_name = data.name;
                    $timeout(() => {
                        M.textareaAutoResize($('#description'));
                        M.updateTextFields();
                    }, 100);
                }, 10, 50);
            });
        };

        let make_strict_chips_object = (id, data, options, forbidden_options, placeholder) => {
            let new_data = [];
            for (let i = 0; i < data.length; i++) {
                new_data.push({tag: data[i]});
            }

            options = options.filter((el) => !forbidden_options.includes(el) );

            let autocomplete_options = {};
            for (let i = 0; i < options.length; i++) {
                autocomplete_options[options[i]] = null;
            }

            $("#" + id).chips({
                data: new_data,
                placeholder: placeholder,
                secondaryPlaceholder: "+" + placeholder,
                autocompleteOptions: {
                    data: autocomplete_options,
                    limit: Infinity,
                    minlength: 0
                },
                onChipAdd: (event) => {
                    let all_chips = event[0].M_Chips.chipsData;
                    let added_chip_name = all_chips[all_chips.length - 1].tag;
                    let is_legal = options.includes(added_chip_name);
                    if (!is_legal) {
                        $("#" + id).chips("deleteChip", all_chips.length - 1);
                        alertify.error("This topic does not exist, please choose a legal topic from the list.");
                    }
                }
            });
        };

        $scope.init_topics_page = () => {
            let prepare_get_dependencies_function = (chips_elem_id) => {
                $scope.topic_data.get_dependencies_topics = () => {
                    let src_array = $('#' + chips_elem_id).chips('getData');
                    let dst = [];
                    for (let i = 0; i < src_array.length; i++) {
                        dst.push(src_array[i].tag);
                    }
                    return dst;
                }
            };

            let extract_topics_list_names = (topics_list) => {
                let topics_names_list = [];
                for (let i = 0; i < topics_list.length; i++) {
                    topics_names_list.push(topics_list[i].name);
                }
                return topics_names_list;
            };

            $scope.get_topic_details = (topic_name) => {
                admin_topics_s.get_topic_details(topic_name, (data) => {
                    $interval(() => {
                        $scope.original_topic_name = data.name;
                        $timeout(() => {
                            M.textareaAutoResize($('#description'));
                            M.updateTextFields();
                        }, 10);
                    }, 10, 50);

                    $scope.get_all_topics(() => {
                        make_strict_chips_object("dependencies_topics", data.dependencies_topics, extract_topics_list_names($scope.topics_list) || [], [data.name],"Dependency Topic");
                        prepare_get_dependencies_function("dependencies_topics");
                    });
                });
            };

            $scope.init_create_new_topic_page = () => {
                $scope.topic_data = {};
                $scope.get_all_topics(() => {
                    make_strict_chips_object("dependencies_topics", [], extract_topics_list_names($scope.topics_list) || [], [],"Dependency Topic");
                    prepare_get_dependencies_function("dependencies_topics");
                });
            }
        };

        $scope.back_to_parent_category = () => {
            window.location.assign(".");
        };
    });