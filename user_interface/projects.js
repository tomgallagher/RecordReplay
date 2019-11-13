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

    //TO DO - get all the current projects from the database, as an array, then loop through the array to update the UI

    //ALL FOLLOWS INSIDE LOOP
    //for (let item in projectStorageArray) { console.log(item); }

    //then we make a clone of the row, that will serve the purpose
    let tempNode = targetRow.cloneNode(true);
    
    //then we need to find each of the elements of the template that need to be adjusted and input from the current project
        
    //tempNode child <td data-label="projectName"></td> needs to have text content set to database projectName
    let projectNameNode = tempNode.querySelector('td[data-label="projectName"]');
    projectNameNode.textContent = "big";
    
    //tempNode child <td data-label="projectDescription"></td> needs to have text content set to database projectDescription
    let projectDescriptionNode = tempNode.querySelector('td[data-label="projectDescription"]');
    projectDescriptionNode.textContent = "hairy";

    //tempNode child <td data-label="projectAuthor"></td> needs to have text content set to database projectAuthor
    let projectAuthorNode = tempNode.querySelector('td[data-label="projectAuthor"]');
    projectAuthorNode.textContent = "monsters";

    //tempNode child <button class="ui editProject button" data-project-id="0"></button> needs to have data-project-id set to the database id
    let projectEditButton = tempNode.querySelector('.ui.editProject.button');
    projectEditButton.setAttribute('data-project-id', 'Hello World!');

    //tempNode child <button class="ui deleteProject negative button" data-project-id="0" data-tooltip="To delete project and all associated tests"></button> needs to have data-project-id set to the database id
    let projectDeleteButton = tempNode.querySelector('.ui.deleteProject.button');
    projectDeleteButton.setAttribute('data-project-id', 'GoodBye World!');

    //then we need to attach the clone of the template node to our container fragment
    docFrag.appendChild(tempNode);

    //then we find the relevant table, using docuement.querySelector which helpfully returns the first Element within the document that matches the specified selector - MAYBE OUTSIDE LOOP
    let projectsTable = document.querySelector('.ui.celled.projectsTable.table tbody');
    
    //then we append each of the project fragments to the table - MAYBE OUTSIDE LOOP
    projectsTable.appendChild(docFrag);
    
    //then once all the work has been done remove class - OUTSIDE LOOP
    $('.ui.savedProjects.verticalTabMenu.segment').removeClass('loading');

}

$(document).ready (function(){

    //edit project button click handler
    $('.ui.editProject.button').on('mousedown', function(){
        //TODO find the project in the database by id, using data-project-id from the template

        //fill the form fields with the saved project data
        $('.ui.editProjectForm.form input[name=projectName]').val('big');
        $('.ui.editProjectForm.form input[name=projectDescription]').val('hairy');
        $('.ui.editProjectForm.form input[name=projectAuthor]').val('monsters');
        //show the form
        $('.editProjectFooter').css("display", "table-footer-group");

    });

    //delete project button click handler
    $('.ui.deleteProject.button').on('mousedown', function(){
        
        //delete the project in the database, using data-project-id from the template

        //then redraw the table
        updateProjectsTable();
    });

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
                event.preventDefault();
                console.log(fields);
                //clear the edit project form
                $('.ui.editProjectForm.form').form('clear');
                //hide the edit project form container
                $('.editProjectFooter').css("display", "none");
                //TO DO we need to redraw the table as well here, after we have saved changes
            }
        });

});