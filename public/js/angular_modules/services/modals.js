angular.module("modalsM", [])
    .service("modals_s", function() {
        let _$scope;
        let _preloader;
        let _dark_area;

        this.init = ($scope, preloader, dark_area) => {
            _$scope = $scope;
            _preloader = preloader;
            _dark_area = dark_area;
        };

        this.create_new_confirmation_modal = (id, title, general_warning, action_description, callback) => {
            // Algorithm
            //  1   Check if id exists
            //  2   IF exists
            //  2.1     replace {{id}}_general_warning content with {{general_warning}}
            //  2.2     Replace {{id}}_action_description content with {{action_description}}
            //  3   IF not exists
            //  3.1     create element E1 [id = {{id}} ] [class = "modal"]
            //  3.2     E1.element E2 [class = "modal-content"]
            //  3.2.1       E2.element E4 [id = {{id + "_general_warning"}}]
            //  3.2.2       E2.element E5 [id = {{id + "_text"}}] [content = "Are you sure you want to "]
            //  3.2.3       E2.element E6 [id = {{id + "_action_description"}}]
            //  3.3     E1.element E3 [class = "modal-footer"]
            //  3.3.1       E3.element E7 a.modal-close.waves-effect.waves-green.btn-flat.accept-modal-trigger content: Yes
            //  3.3.2       E3.element E8 a.modal-close.waves-effect.waves-red.btn-flat.cancel-modal-trigger content: No
            //  3.4     Append modal to document
            //  4   set $(#{{id}}).filter(.accept-modal-trigger).click = () => { callback(true); };
            //  5   set $(#{{id}}).filter(.cancel-modal-trigger).click = () => { callback(false); };
            //  6   Define modal
            //  7   Open the modal

            general_warning = general_warning ? "<div class='valign-wrapper flash flash-warn'><i class='material-icons' style='padding-right: 5px;'>warning</i> " + general_warning + "</div><br>" : "";

            let main_modal = $("[id = '" + id + "']");
            // 1 Check if id exists
            if (main_modal.length) { // 2 IF exists
                $("[id = '" + id + "_title']").html(title);
                $("[id = '" + id + "_general_warning']").html(general_warning); // 2.1
                $("[id = '" + id + "_action_description']").html(action_description); // 2.2
            } else { // 3 IF not exists
                let modal_container = $("<div id='" + id + "' class='modal'>"); // 3.1

                //  3.2     E1.element E2 [class = "modal-content"]
                let modal_content = $("<div class='modal-content'>");
                modal_container.append(modal_content);
                modal_content.append("<h4 id='" + id + "_title'>" + title + "</h4>");
                modal_content.append("<div id='" + id + "_general_warning'>" + general_warning + "</div>"); // 3.2.1
                modal_content.append(
                    "<h5><span id='" + id + "_text'>Are you sure you want to </span>"  // 3.2.2
                    + "<sapn id='" + id + "_action_description'>" + action_description + "</sapn>?</h5>"); // 3.2.3

                //  3.3     E1.element E3 [class = "modal-footer"]
                let modal_footer = $("<div class='modal-footer'>");
                modal_container.append(modal_footer);
                modal_footer.append("<a class='modal-close waves-effect waves-green btn-flat accept-modal-trigger'>Yes</a>"); // 3.3.1
                modal_footer.append("<a class='modal-close waves-effect waves-red btn-flat cancel-modal-trigger'>No</a>"); // 3.3.2
                $("body").append(modal_container); // 3.4
                main_modal = $("[id = '" + id + "']");
            }
            //  4   set $(#{{id}}).filter(.accept-modal-trigger).click = () => { callback(true); };
            main_modal.find(".accept-modal-trigger").unbind('click'); // Delete previous event
            main_modal.find(".accept-modal-trigger").on('click', function() { // Define new event
                callback(true);
            });
            //  5   set $(#{{id}}).filter(.cancel-modal-trigger).click = () => { callback(false); };
            main_modal.find(".cancel-modal-trigger").unbind('click'); // Delete previous event
            main_modal.find(".cancel-modal-trigger").on('click', function() { // Define new event
                callback(false);
            });
            main_modal.modal(); // 6
            main_modal.modal('open'); // 7
        };
    });

/*

<div id="confirmation_modal" class="modal">
    <div class="modal-content">
        <span id="confirmation_modal_general_warning"></span>
        Are you sure to <span id="confirmation_modal_action_description"></span>?
    </div>
    <div class="modal-footer">
        <a href="#!" class="modal-close waves-effect waves-green btn-flat accept-modal-trigger">Yes</a>
        <a href="#!" class="modal-close waves-effect waves-red btn-flat cancel-modal-trigger">No</a>
    </div>
</div>

 */