angular.module("filesM", [])

    .filter('img_files_filter', ['files_s', function(files_s) {
        let image_files_extensions = [
            "gif", "png", "jpeg", "jpg"
        ];
        return function(items, exclude_files) {
            items = items || [];
            return items.filter((filename) => {
                return image_files_extensions.includes(files_s.get_extension(filename)) !== exclude_files;
            })
        };
    }]);