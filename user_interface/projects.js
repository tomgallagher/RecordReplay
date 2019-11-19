function addProjectTableButtonListeners() {

    //edit project button click handler
    $('.ui.editProject.button:not(submit)').on('mousedown', function(event){
        
        //find the project in the database by id, using data-project-id from the template
        const projectKey = $(this).attr("data-project-id");
        //the project key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('projects.js', projectKey, 'projects')
            //then we have a returned js object with the project details
            .then(project => {

                //fill the hidden form field with the test id number, so we can retrieve after validation has been passed
                $('.ui.editProjectForm.form input[name=hiddenProjectId]').val(projectKey);
                //fill the form fields with the saved project data
                $('.ui.editProjectForm.form input[name=projectName]').val(project.projectName);
                $('.ui.editProjectForm.form input[name=projectDescription]').val(project.projectDescription);
                $('.ui.editProjectForm.form input[name=projectAuthor]').val(project.projectAuthor);
                //clear any success state from the form
                $('.ui.editProjectForm.form').removeClass('success');
                //clear any error state from the form
                $('.ui.editProjectForm.form').removeClass('error');
                //show the form
                $('.editProjectFooter').css("display", "table-footer-group");

            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));      

    });

    //delete project button click handler
    $('.ui.deleteProject.button').on('mousedown', function(){
        
        //delete the project in the database, using data-project-id from the template
        const projectKey = $(this).attr("data-project-id");
        //the project key will be in string format - StorageUtils handles conversion
        StorageUtils.cascadeDeleteByProjectID('projects.js', projectKey)
            //then we have nothing returned
            .then( () => {
                //then redraw the table
                updateProjectsTable();
            })
            //the delete single object function will reject if object is not in database
            .catch( () => console.error(`Error Deleting Project ${projectKey}`));  

        
    });

}

function updateProjectsTable() {

    //add the loading indicator to the segment
    $('.ui.savedProjects.verticalTabMenu.segment').addClass('loading');
    //empty the projects table body so we can add the updated information
    $('.ui.celled.projectsTable.table tbody').empty();
    //target our table row template first, we only need to find the template once
    let targetNode = document.querySelector('.projectTableRowTemplate');
    //we need to do more work as we have to save the template in a table, which we don't need, we just want the row
    let targetRow = targetNode.querySelector('tr');
    //then create a document fragment that we will use as a container for each looped template
    let docFrag = document.createDocumentFragment();
    //then get all the current projects from the database, as an array
    StorageUtils.getAllObjectsInDatabaseTable('projects.js', 'projects')
        //once we have the array then we can start populating the table by looping through the array
        .then(projectStorageArray => {
            
            //use for-in loop as execution order is maintained
            for (let project in projectStorageArray) { 

                //first we make a clone of the row, that will serve the purpose
                let tempNode = targetRow.cloneNode(true);
                //then we need to find each of the elements of the template that need to be adjusted and input from the current project
                //tempNode child <td data-label="projectName"></td> needs to have text content set to database projectName
                let projectNameNode = tempNode.querySelector('td[data-label="projectName"]');
                projectNameNode.textContent = projectStorageArray[project].projectName;
                //tempNode child <td data-label="projectDescription"></td> needs to have text content set to database projectDescription
                let projectDescriptionNode = tempNode.querySelector('td[data-label="projectDescription"]');
                projectDescriptionNode.textContent = projectStorageArray[project].projectDescription;
                //tempNode child <td data-label="projectAuthor"></td> needs to have text content set to database projectAuthor
                let projectAuthorNode = tempNode.querySelector('td[data-label="projectAuthor"]');
                projectAuthorNode.textContent = projectStorageArray[project].projectAuthor;
                //tempNode child <button class="ui editProject button" data-project-id="0"></button> needs to have data-project-id set to the database id
                let projectEditButton = tempNode.querySelector('.ui.editProject.button');
                projectEditButton.setAttribute('data-project-id', projectStorageArray[project].id);
                //tempNode child <button class="ui deleteProject negative button" data-project-id="0" data-tooltip="To delete project and all associated tests"></button> needs to have data-project-id set to the database id
                let projectDeleteButton = tempNode.querySelector('.ui.deleteProject.button');
                projectDeleteButton.setAttribute('data-project-id', projectStorageArray[project].id);
                //then we need to attach the clone of the template node to our container fragment
                docFrag.appendChild(tempNode);

            }

            //then after the entire loop has been executed we need to adjust the dom in one hit, avoid performance issues with redraw
            //we find the relevant table, using document.querySelector which helpfully returns the first Element within the document that matches the specified selector
            let projectsTable = document.querySelector('.ui.celled.projectsTable.table tbody');
            //then we append each of the project fragments to the table
            projectsTable.appendChild(docFrag);
            //then once all the work has been done remove loading class to show the updated table 
            $('.ui.savedProjects.verticalTabMenu.segment').removeClass('loading');
            //then add the listeners for the buttoms built into the form
            addProjectTableButtonListeners();

        });

}

$(document).ready (function(){

    //validation for the edit project form
    $('.ui.editProjectForm.form')
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
                $('.ui.editProjectForm ui.submit.button').addClass('loading');
                //just keep track of field names - they must be the same as model attributes when we create a new class object
                console.log(fields);
                //create a new project with the fields from the form - there is the added hidden field to pass project id but model cleans this up
                const editedProject = new Project(fields);
                //then send the edited project off to the database
                StorageUtils.updateModelObjectInDatabaseTable('projects.js', fields.hiddenProjectId, editedProject, 'projects')
                    //then we have nothing returned so we just make the adjustments
                    .then( () => {
                        //remove the loading indicator from the button, to indicate saving of the project to the database complete
                        $('.ui.editProjectForm ui.submit.button').removeClass('loading');
                        //then redraw the table
                        updateProjectsTable();
                        //clear the edit project form
                        $('.ui.editProjectForm.form').form('clear');
                        //hide the edit project form container
                        $('.editProjectFooter').css("display", "none");
                    });
            }

        });

});