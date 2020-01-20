function addProjectTableRowsFragment(projectStorageArray) {

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

    //use for-of loop for easier reading
    for (let project of projectStorageArray) { 

        //first we make a clone of the row, that will serve the purpose
        let tempNode = targetRow.cloneNode(true);
        //then we need to find each of the elements of the template that need to be adjusted and input from the current project
        //tempNode child <td data-label="projectName"></td> needs to have text content set to database projectName
        let projectNameNode = tempNode.querySelector('td[data-label="projectName"]');
        projectNameNode.textContent = project.projectName;
        //tempNode child <td data-label="projectDescription"></td> needs to have text content set to database projectDescription
        let projectDescriptionNode = tempNode.querySelector('td[data-label="projectDescription"]');
        projectDescriptionNode.textContent = project.projectDescription;
        //tempNode child <td data-label="projectAuthor"></td> needs to have text content set to database projectAuthor
        let projectAuthorNode = tempNode.querySelector('td[data-label="projectAuthor"]');
        projectAuthorNode.textContent = project.projectAuthor;
        //tempNode child <td data-label="projectCreated"></td> needs to have text content set to database projectCreated
        let projectCreatedNode = tempNode.querySelector('td[data-label="projectCreated"]');
        projectCreatedNode.textContent = new Date(project.projectCreated).toLocaleString();
        //tempNode child <button class="ui editProject button" data-project-id="0"></button> needs to have data-project-id set to the database id
        let projectEditButton = tempNode.querySelector('.ui.editProject.button');
        projectEditButton.setAttribute('data-project-id', project.id);
        //tempNode child <button class="ui deleteProject negative button" data-project-id="0" data-tooltip="To delete project and all associated tests"></button> needs to have data-project-id set to the database id
        let projectDeleteButton = tempNode.querySelector('.ui.deleteProject.button');
        projectDeleteButton.setAttribute('data-project-id', project.id);
        //then we need to attach the clone of the template node to our container fragment
        //<input type="checkbox" data-project-id="0" data-project-name="">
        let projectCheckbox = tempNode.querySelector('input[type="checkbox"]');
        projectCheckbox.setAttribute('data-project-id', project.id);
        projectCheckbox.setAttribute('data-project-name', project.projectName);
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

} 

function addProjectTablePaginationListener() {

    $('.ui.projectsTable .ui.pagination.menu .item').on('click', function(){

        //get the current page displayed, set to zero by default
        var currentPage = Number($('.ui.projectsTable .ui.pagination.menu').attr('data-current-page'));
        //get the classes of the active item as a list
        const classArray = $(this).attr('class').split(/\s+/);
        //then get all the current projects from the database, as an array
        StorageUtils.getAllObjectsInDatabaseTable('projects.js', 'projects')
            //once we have the array then we can start populating the table by looping through the array
            .then(projectStorageArray => {
                
                //then we paginate here using the class
                const paginator = new Pagination(projectStorageArray);
                //get the maximum number of possible pages
                const maxPages = paginator.getTotalPagesRequired();
                //then we need to work out the target page
                switch(true) {
                    case classArray.includes('back'):
                        //if it's greater than 1, one page less
                        currentPage > 1 ? currentPage-- : null
                        break;
                    case classArray.includes('forward'):
                        //if it's less than maxpages, one page more
                        currentPage < maxPages ? currentPage++ : null
                        break;
                    default:
                        currentPage = Number($(this).attr('data-page-required'));
                }
                //then update the data property for current page
                $('.ui.projectsTable .ui.pagination.menu').attr('data-current-page', currentPage);
                //then set the storage array to the current page 
                projectStorageArray = paginator.getParticularPage(currentPage);
                //then update the table
                addProjectTableRowsFragment(projectStorageArray);
                
        });

    });

}

function addProjectTableButtonListeners() {

    //edit project button click handler
    $('.ui.editProject.button:not(submit)').on('click', function(event){
        
        //find the project in the database by id, using data-project-id from the template
        const projectKey = $(this).attr("data-project-id");
        //the project key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('projects.js', projectKey, 'projects')
            //then we have a returned js object with the project details
            .then(project => {

                //fill the hidden form field with the test id number, so we can retrieve after validation has been passed
                $('.ui.editProjectForm.form input[name=hiddenProjectId]').val(projectKey);
                $('.ui.editProjectForm.form input[name=hiddenProjectCreated]').val(project.projectCreated);
                //fill the form fields with the saved project data
                $('.ui.editProjectForm.form input[name=projectName]').val(project.projectName);
                $('.ui.editProjectForm.form input[name=projectDescription]').val(project.projectDescription);
                $('.ui.editProjectForm.form input[name=projectAuthor]').val(project.projectAuthor);
                //clear any success state from the form
                $('.ui.editProjectForm.form').removeClass('success');
                //clear any error state from the form
                $('.ui.editProjectForm.form').removeClass('error');
                //show the form
                $('.editProjectFooter').css("display", "table-row");

            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));      

    });

    //delete project button click handler
    $('.ui.deleteProject.button').on('dblclick', function(){
        
        //delete the project in the database, using data-project-id from the template
        const projectKey = $(this).attr("data-project-id");
        //the project key will be in string format - StorageUtils handles conversion
        StorageUtils.cascadeDeleteByProjectID('projects.js', projectKey)
            //then we have nothing returned
            .then( () => {
                //then redraw the table
                updateProjectsTable();
                //then run the function that enables the buttons
                enableVerticalMenuButtonsWhenDataAllows();
            })
            //the delete single object function will reject if object is not in database
            .catch( () => console.error(`Error Deleting Project ${projectKey}`));  

    });

    //default project check box handler
    $('.ui.projectsTable .projectDefaultCheckbox').change(function() {
        if (this.checked) {
            //make sure we set the others as not checked in the user interface
            $('.ui.projectsTable .projectDefaultCheckbox:checked').not(this).prop("checked", false);
            //then enable all delete buttons
            $(`.ui.projectsTable .ui.deleteProject.button`).removeClass('disabled');
            //then disable the related delete button - we cannot have a default project being deleted
            $(`.ui.projectsTable .ui.deleteProject.button[data-project-id=${$(this).attr("data-project-id")}]`).addClass('disabled');
            //then write the project name to the top left corner
            $('.defaultProject').text($(this).attr("data-project-name"));
            //then make it visible
            $('.defaultProject').css('visibility', 'visible');
            //and save the default project to local storage
            localStorage.setItem("DefaultProject", $(this).attr("data-project-id"));
        } else {
            //then disable the related delete button - we cannot have a default project being deleted
            $(`.ui.projectsTable .ui.deleteProject.button[data-project-id=${$(this).attr("data-project-id")}]`).removeClass('disabled');
            //change text to default
            $('.defaultProject').text("Default Project");
            //then make it hidden
            $('.defaultProject').css('visibility', 'hidden');
            //save value of zero to local storage, indicating no default project
            localStorage.setItem("DefaultProject", "0");
        }
    });

    //make sure the default project is reflected in the checkboxes
    const defaultProjectId = localStorage.getItem("DefaultProject");
    $(`.ui.projectsTable .projectDefaultCheckbox[data-project-id=${defaultProjectId}]`).click();


}

function updateProjectsTable() {

    //then get all the current projects from the database, as an array
    StorageUtils.getAllObjectsInDatabaseTable('projects.js', 'projects')
        //once we have the array then we can start populating the table by looping through the array
        .then(projectStorageArray => {
            
            //then we paginate here using the class
            const paginator = new Pagination(projectStorageArray);
            //first we want to get the number of pages
            if (paginator.getTotalPagesRequired() > 1) {
                //then, if we have a number greater than 1 we need to build the paginator menu
                const menu = paginator.buildMenu(paginator.getTotalPagesRequired());
                //then grab the menu holder and empty it
                $('.ui.projectsTable .paginationMenuHolder').empty();
                //then append our menu 
                $('.ui.projectsTable .paginationMenuHolder').append(menu);
                //then show the menu holder
                $('.ui.projectsTable .paginationMenuRow').css("display", "table-row");
                //then activate the buttons
                addProjectTablePaginationListener();
            }
            //then make sure the table is showing the first page
            projectStorageArray = paginator.getParticularPage(1);
            //then update the table
            addProjectTableRowsFragment(projectStorageArray);
        
        });

}

$(document).ready (function(){

    //make sure the default project is reflected in the header
    const defaultProjectId = localStorage.getItem("DefaultProject");
    //the project key will be in string format - StorageUtils handles conversion
    StorageUtils.getSingleObjectFromDatabaseTable('projects.js', defaultProjectId, 'projects')
        //then we have a returned js object with the project details
        .then(project => {
            //then write the project name to the top left corner
            $('.defaultProject').text(project.projectName);
            //then make it visible
            $('.defaultProject').css('visibility', 'visible');
        })
        .catch(_ => console.log("No Default Project Set"));

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
                //change the fields object to pass the hidden project created field to the edited project, so the project created remains the same
                //test created going to come as a field value down so it will be a string
                fields.projectCreated = StorageUtils.standardiseKey(fields.hiddenProjectCreated);
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