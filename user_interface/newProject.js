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
                //always need to have this with a submit button otherwise the entire page reloads
                event.preventDefault();
                //add the loading indicator to the button, to indicate saving of the project to the database
                $('.ui.newProjectForm .ui.submit.button').addClass('loading');
                //just keep track of field names - they must be the same as model attributes when we create a new class object
                console.log(fields);
                //create a new project with the fields from the form
                const newProject = new Project(fields);
                //then send the new project off to the database
                StorageUtils.addModelObjectToDatabaseTable('newProject.js', newProject, 'projects')
                    //which does not return anything but we don't need it as we fetch from database directly to update the projects table
                    .then( () => {
                        //remove the loading indicator from the button
                        $('.ui.newProjectForm .ui.submit.button').removeClass('loading');
                        //clear the form to eliminate any confusion
                        $('.ui.newProjectForm.form').form('clear');
                        //then run the function that enables the buttons
                        enableVerticalMenuButtonsWhenDataAllows();
                    });
            }
            
        });

});