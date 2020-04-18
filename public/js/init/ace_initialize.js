(function() {
    var dom = ace.require("ace/lib/dom");

    //ace.config.set("enableBasicAutocompletion", true);

    //add command to all new editor instances
    ace.require("ace/commands/default_commands").commands.push({
        name: "Toggle Fullscreen",
        bindKey: "F11",
        exec: function(editor) {
            var fullScreen = dom.toggleCssClass(document.body, "fullScreen");
            dom.setCssClass(editor.container, "fullScreen", fullScreen);
            editor.setAutoScrollEditorIntoView(!fullScreen);
            editor.resize();
        }
    })
})();