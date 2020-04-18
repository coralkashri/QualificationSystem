angular.module("filesM", [])

    .directive('lightgallery', function() {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                if (scope.$last) {

                    // ng-repeat is completed
                    /*element.parent().lightGallery({
                        thumbnail: true
                    });*/
                }
            }
        };
    });