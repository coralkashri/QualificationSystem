angular.module("adminPlansM", [])
    .directive('dependencyOrderValidation', function() {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attr, controller) {
                controller.$validators.dependencies_come_first = _ => {
                    const container = elem.parent().parent().parent();
                    const items = $(container).find(">div");
                    const current_element_pos = items.index(elem.parent().parent());
                    const current_topic_name = items[current_element_pos].querySelector("[data-topic-name]").getAttribute("data-topic-name");
                    for (let i = 0; i < current_element_pos; i++) {
                        if (items[i].querySelector("input").checked) {
                            let dependencies = items[i].querySelector("[data-topic-dependencies]").getAttribute("data-topic-dependencies");
                            if (dependencies.includes(current_topic_name)) {
                                return false;
                            }
                        }
                    }
                    return true;
                };
                return true;
            }
        }
    });