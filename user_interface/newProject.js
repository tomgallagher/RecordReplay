$(document).ready (function(){

    //validation for the new project form
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
                //add the loading indicator to the button
                $('.ui.newProject.submit.button').addClass('loading');
                console.log(fields);
                //TO DO - save project to the database
                
                //remove the loading indicator from the button
                $('.ui.newProject.submit.button').removeClass('loading');
                //clear the form to eliminate any confusion
                $('.ui.newProjectForm.form').form('clear');
                //then run the function that enables the buttons
                enableVerticalMenuButtonsWhenDataAllows();
            }
        });

});