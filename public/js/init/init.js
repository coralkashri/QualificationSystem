function init_materialize() {
    $('select').formSelect();
    let collapsible = $('.collapsible');
    collapsible.collapsible();
    collapsible.filter('.expandable').collapsible({
        accordion: false
    });
    $('.dropdown-trigger').dropdown();
    $('#user_options_dropdown_trigger').dropdown({
 //       width: 140,
        position: "static"
    });
    /*$('#advanced_search_version_modal .tabs').tabs({
        onShow: () => {
            $('#advanced_search_version_modal .tabs').tabs("select", "advanced_search_by_version");
        }
    });*/
}

/**
 * Initialize Alertify Properties
 */
function initialize_alertify_properties() {
    alertify.setPosition(false, 1);
    alertify.setTemplate(function (input) {
        return "<b>" + input + "</b>";
    });
}

function init_scroll() {
    if (!document.getElementById("page_sticky_header")) return;
    let header, sticky;
    header = $(".sticky-action");
    //sticky = header.offsetTop;

    function downAction() {
        header.removeClass('open');
        header.removeClass('home');
        header.addClass('collapse');
        $(".dropdown-trigger").dropdown('close');
    }

    function upAction() {
        header.removeClass('collapse');
        header.removeClass('home');
        header.addClass('open');
        header.addClass("sticky");
    }

    function homeAction() {
        header.removeClass('collapse');
        header.addClass('home');
        header.addClass('open');
        header.removeClass("sticky");
    }

    var scrollTop = function() {
        return window.scrollY;
    };
    let scrollState = 0;
    let scrollDetect = function(home, down, up) {
        // Current scroll position
        var currentScroll = scrollTop();
        if (scrollTop() === 0) {
            home();
        } else if (currentScroll > scrollState) {
            down();
        } else {
            up();
        }
        // Set previous scroll position
        scrollState = scrollTop();
    };
    window.onscroll = function () {
        /*if (window.pageYOffset > sticky) {
            header_classes.add("sticky");
        } else {
            header_classes.remove("sticky");
        }*/
        scrollDetect(homeAction, downAction, upAction);
    };
}

function scroll_to_top() {
    $("html, body").animate({ scrollTop: $('body').offset().top }, 1000);
}

function init_all() {
    init_materialize();
    initialize_alertify_properties();
    init_scroll();
}

function ng_init_sidenav(dark_area) {
    let sidenav_instance = $(".sidenav");
    if (sidenav_instance) {
        sidenav_instance.sidenav({
            onOpenStart: function () {
                dark_area.show(); // Show dark area (dismiss area)
            },
            draggable: true,
            onCloseEnd: function () {
                dark_area.hide(); // Hide dark area (dismiss area)
            },
            edge: 'left'
        });
    }
}

function loadScript(url, callback)
{
    // Adding the script tag to the head as suggested before
    var head = document.head;
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

angular.element(function () { // When all angular elements are ready
    $('select').formSelect();
    let sidenav_instance = $(".sidenav");
    sidenav_instance.find("a[href^='#/']").bind('click', ()=>{
        $(".dismiss_area").trigger('click');
    });
});

(function($) {
    $(document).ready(function(){
        init_all();
        $('.tabs').tabs();
    });
})(jQuery);