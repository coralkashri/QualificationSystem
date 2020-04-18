angular.module("aceM", [])
    .directive('ace', function() {
        return {
            restrict: 'A',
            require: '?ngModel',
            scope: {
                ace: '&'
            },

            link: function (scope, element, attrs, ngModel) {

                // create editor and call initialize callback
                var editor = ace.edit(element[0]);

                if (scope.ace) {
                    scope.ace()(editor);
                }

                // sync editor changes with the model
                editor.getSession().on('change', function () {
                    scope.$evalAsync(function () {
                        ngModel.$setViewValue(editor.getValue());
                    });
                });

                // sync model changes with the editor
                ngModel.$render = function () {
                    editor.setValue(ngModel.$viewValue || '');
                };
            }
        }
    });