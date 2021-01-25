

const Page = new function(){

    this.file;
    this.unsavedChanges = false;

    this.SELECTORS = [
        'id',
        'name',
        'text',
        'link_text',
        'partial_link_text',
        'css',
        'xpath',
        'tag_name'
    ]

    this.initialize = function(file) {
        this.file = file;
        this.startAllSelectorInputAutocomplete();
        $(".element-name").keyup(function(){
            $(this).closest('.element').find('.element-display-name').val($(this).val());
        });
        // set unsaved changes watcher
        this.watchForUnsavedChanges();
    };

    this.startAllSelectorInputAutocomplete = function() {
        let lookup = []
        for(selector of this.SELECTORS){
            lookup.push({
                value: selector,
                data: selector
            })
        }
        $(".element-selector").each(function(){
            autocomplete = $(this).autocomplete({
                lookup: lookup,
                minChars: 0
            })
        })
    }

    this.addPageObjectInput = function() {
        $("#elements").append(
            "<div class='element col-md-12 clearfix'> \
                <div style='width: calc(100% - 34px)'>\
                    <div class='col-xs-3 no-pad-left padding-right-5'> \
                        <input type='text' class='form-control element-name' placeholder='name'> \
                    </div> \
                    <div class='col-xs-3 padding-left-5 padding-right-5'> \
                        <input type='text' class='form-control element-selector' placeholder='selector'> \
                    </div> \
                    <div class='col-xs-3 padding-left-5 padding-right-5'> \
                        <input type='text' class='form-control element-value' placeholder='value'> \
                    </div> \
                    <div class='col-xs-3 padding-left-5 no-pad-right'> \
                        <input type='text' class='form-control element-display-name' placeholder='display name'> \
                    </div> \
                </div>\
                <div class='step-remove-icon'>\
                    <a href='javascript:void(0)' onclick='deleteElement(this);'>\
                        <span class='glyphicon glyphicon-remove' aria-hidden='true'></span>\
                    </a>\
                </div>\
            </div>");

        // give focus to the last input
        $("#elements>div").last().find("input").first().focus();
        this.startAllSelectorInputAutocomplete();
        $(".element-name").keyup((e) => {
            let elem = $(e.target);
            elem.parent().parent().parent().find('.element-display-name').val(elem.val());
        });
        $("#elements input").on("change", () => unsavedChanges = true);
    }

    this.save = function() {
        let elements = [];
        let functions = [];
        let importLines = [];
        let errors = false;
        $(".element").each(function(){
            if($(this).find('.element-name').val().length > 0){
                let name = $(this).find('.element-name').val().trim();
                let selector = $(this).find('.element-selector').val();
                let value = $(this).find('.element-value').val();
                let display_name = $(this).find('.element-display-name').val();
                // validate the name is a valid python variable name
                let validChars = /^[0-9a-zA-Z\_]+$/;
                if(!name.match(validChars)){
                    Main.Utils.displayErrorModal(['Element names should contain only letters, numbers and underscores']);
                    errors = true;
                } else if(!isNaN(name.charAt(0))){
                    Main.Utils.displayErrorModal(['Element names should not begin with a digit']);
                    errors = true
                } else {
                    elements.push({
                        'name': name,
                        'selector': selector,
                        'value': value,
                        'display_name': display_name
                    });
                }
            }
        });
        $(".function").each(function(){
            functions.push($(this).find('.func-code').val());
        });
        $(".import-line").each(function(){
            importLines.push($(this).val());
        });

        if(errors){ return }

        xhr.put('/api/page/save', {
            project: Global.project,
            pageName: pageObjectName,
            elements: elements,
            functions: functions,
            importLines: importLines
        }, result => {
            Main.Utils.toast('success', `Page ${this.file.fullName} saved`, 3000);
            this.unsavedChanges = false;
        })
    }

    this.watchForUnsavedChanges = function() {
        $("#elements input").on("change keyup paste", () => this.unsavedChanges = true);
        window.addEventListener("beforeunload", (e) => {
            if(this.unsavedChanges){
                let confirmationMessage = 'There are unsaved changes';
                (e || window.event).returnValue = confirmationMessage; //Gecko + IE
                return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
            }
        });
    }

    this.loadCodeView = function() {
        if(this.unsavedChanges)
            this.save()
        this.unsavedChanges = false;
        // redirect to gui view
        let  pathname = window.location.pathname;
        window.location.replace(pathname + 'code/');
    }

    this.deleteElement = function (elem) {
        $(elem).closest('.element').remove();
        this.unsavedChanges = true;
    }
}
