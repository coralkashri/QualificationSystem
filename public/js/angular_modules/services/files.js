angular.module("filesM", [])

    .service("files_s", function() {
        let _$scope, _$http, _$sce, _timers_manager, _preloader;

        this.get_extension = (filename) => {
            return filename.split('.').pop();
        };

        this.init = ($scope, $http, $sce, timers_manager, preloader) => {
            _$http = $http;
            _$scope = $scope;
            _timers_manager = timers_manager;
            _preloader = preloader;
            _$sce = $sce;

            _timers_manager.add_timer("material_boxes_rebuild", () => {
                $('.materialboxed').materialbox();
            }, 500);

            $scope.display_file = (filename, classes) => {
                let uploads_path = "/uploads_dir/";
                let file_full_path = uploads_path + filename;
                let html;
                switch (this.get_extension(filename)) {
                    case "gif":
                    case "png":
                    case "jpeg":
                    case "jpg":
                        html = "<img src='" + file_full_path + "'  alt='' style='width: 50%; display: flex' class='materialboxed " + (classes || "") + "'/>";
                        _timers_manager.start_timer("material_boxes_rebuild");
                        break;

                    case "pdf":
                    default:
                        html = $sce.trustAsHtml("<iframe src='/viewer/index.html#" + file_full_path + "' width='400' height='300' allowfullscreen webkitallowfullscreen></iframe>");
                        break;
                }

                return html;
            };
        }
    });