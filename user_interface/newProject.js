$(document).ready (function(){

    $('.ui.newProjectForm.form')
        .form({
            on: 'blur',
            fields: {
                projectName: {
                    identifier: 'projectName',
                    rules: [
                        { type : 'empty', prompt : 'Please enter project name' }
                    ]
                },
                projectDescription: {
                    identifier: 'projectDescription',
                    rules: [
                        { type : 'empty', prompt : 'Please enter project description' }
                    ]
                },
                projectAuthor: {
                    identifier: 'projectAuthor',
                    rules: [
                        { type : 'empty', prompt : 'Please identify project owner' }
                    ]
                }
            },
            onSuccess(event, fields) {
                event.preventDefault();
                console.log(fields);
                $('.ui.newProjectForm.form').form('clear');
            }
        });

});