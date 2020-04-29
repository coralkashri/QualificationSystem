angular.module("globalM", [])
    .directive('customValidity', function() {
        return {
            restrict: 'A',
            scope: {

            },
            template: "",

            link: function (scope, element, attrs, ngModel) {
                element[0].setCustomValidity(attrs.customValidity);
            }
        }
    });