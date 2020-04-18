(function($)
{
    /*
     * $.import_js() helper (for JavaScript importing within JavaScript code).
     */
    var import_js_imported = [];

    $.extend(true,
        {
            import_js : function(script)
            {
                var found = false;
                for (var i = 0; i < import_js_imported.length; i++)
                    if (import_js_imported[i] == script) {
                        found = true;
                        break;
                    }

                if (found == false) {
                    $("head").append('<script type="text/javascript" src="' + script + '"></script>');
                    import_js_imported.push(script);
                }
            }
        });

})(jQuery);