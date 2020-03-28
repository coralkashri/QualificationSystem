angular.module("loaderM", [])

    .service("preloader", function() {
        this.start = () => {
            $(".circular-preloader").addClass("active");
            //$(".preloader_status").addClass("progress");
        };

        this.stop = () => {
            $(".circular-preloader").removeClass("active");
            //$(".preloader_status").removeClass("progress");
        };
    })

    .service("dark_area", function() {
        this.is_dismiss_on = true;
        this.show = () => {
            $(".dismiss_area").addClass("on");
        };

        this.hide = () => {
            $(".dismiss_area").removeClass("on");
        };

        $(".dismiss_area").click(function() {
            if (is_dismiss_on) {
                $(".sidenav").sidenav("close");
                $(".dismiss_area").removeClass("on");
            }
        });

        this.turn_on_dismiss = () => {
            is_dismiss_on = true;
        };

        this.turn_off_dismiss = () => {
            is_dismiss_on = false;
        };
    });