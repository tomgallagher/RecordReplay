function addTestTableRowsFragment(testStorageArray) {

    //add the loading indicator to the segment
    $('.ui.savedTests.verticalTabMenu.segment').addClass('loading');
    //empty the tests table body so we can add the updated information
    $('.ui.celled.testsTable.table tbody').empty();
    //target our table row template first, we only need to find the template once
    let targetNode = document.querySelector('.testTableRowTemplate');
    //we need to do more work as we have to save the template in a table, which we don't need, we just want the row
    let targetRow = targetNode.querySelector('tr');
    //then create a document fragment that we will use as a container for each looped template
    let docFrag = document.createDocumentFragment();

    //use for-of loop for easier reading
    for (let test of testStorageArray) { 

        //then we make a clone of the row, that will serve the purpose
        let tempNode = targetRow.cloneNode(true);
        //then we need to find each of the elements of the template that need to be adjusted and input from the current project
        
        //tempNode child <td data-label="testName"></td> needs to have text content set to database testName
        let testNameNode = tempNode.querySelector('td[data-label="testName"]');
        testNameNode.textContent = test.testName;
        
        //tempNode child <td data-label="testDescription"></td> needs to have text content set to database testDescription
        let testDescriptionNode = tempNode.querySelector('td[data-label="testDescription"]');
        testDescriptionNode.textContent = test.testDescription;
        
        //tempNode child <td data-label="testAuthor"></td> needs to have text content set to database testAuthor
        let testAuthorNode = tempNode.querySelector('td[data-label="testAuthor"]');
        testAuthorNode.textContent = test.testAuthor;
        
        //tempNode child <td data-label="projectName"></td> needs to have text content set to database projectName
        let testProjectNode = tempNode.querySelector('td[data-label="projectName"]');
        testProjectNode.textContent = test.testProjectName;     
        
        //tempNode child <td data-label="testStartUrl" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;"></td>
        let testUrlNode = tempNode.querySelector('td[data-label="testStartUrl"]');
        testUrlNode.textContent = test.testStartUrl;
        //any text-overflow elements should have a title with the whole string
        testUrlNode.title = test.testStartUrl;
        
        //tempNode child <td data-label="testBandwidth"></td> needs to have text content set to database testBandwidth
        let testBandWidthNode = tempNode.querySelector('td[data-label="testBandwidth"]');
        testBandWidthNode.textContent = test.testBandwidthName;
        
        //tempNode child <td data-label="testLatency"></td> needs to have text content set to database testLatency
        let testLatencyNode = tempNode.querySelector('td[data-label="testLatency"]');
        testLatencyNode.textContent = test.testLatencyName;
        
        //tempNode child <td data-label="testAdditionalReporting"></td> needs to have text content set to database testAdditionalReporting
        let testAdditionalReportingNode = tempNode.querySelector('td[data-label="testAdditionalReporting"]');
        //we need to combine the booleans into a comma separated string indicating extra values
        var additionalReportsArray = [];
        test.testPerformanceTimings == true ? additionalReportsArray.push('Performance') : null;
        test.testResourceLoads == true ? additionalReportsArray.push('Resources') : null;
        test.testScreenshot == true ? additionalReportsArray.push('Screenshot') : null;
        test.testVisualRegression == true ? additionalReportsArray.push('Visual Changes') : null;
        testAdditionalReportingNode.textContent = additionalReportsArray.join(', ');
        
        //tempNode child <td data-label="testCreated"></td> needs to have text content set to database testCreated
        let testCreatedNode = tempNode.querySelector('td[data-label="testCreated"]');
        testCreatedNode.textContent = new Date(test.testCreated).toLocaleDateString();
        
        //tempNode child <a class="editTestLink" data-test-id="0">Edit</a> needs to have data-test-id set to the database id
        let testEditButton = tempNode.querySelector('.editTestLink');
        testEditButton.setAttribute('data-test-id', `${test.id}`);
        
        //tempNode child <a class="deleteTestLink" style="color: red" data-test-id="0" data-tooltip="To delete test and all associated recordings and replays" data-position="left center">Edit</a> needs to have data-test-id set to the database id
        let testDeleteButton = tempNode.querySelector('.deleteTestLink');
        testDeleteButton.setAttribute('data-test-id', `${test.id}`);
        
        //then we need to attach the clone of the template node to our container fragment
        docFrag.appendChild(tempNode);

    }

    //then after the entire loop has been executed we need to adjust the dom in one hit, avoid performance issues with redraw
    //then we find the relevant table, using docuement.querySelector which helpfully returns the first Element within the document that matches the specified selector
    let testsTable = document.querySelector('.ui.celled.testsTable.table tbody');
    //then we append the fragment to the table
    testsTable.appendChild(docFrag);
    //then once all the work has been done remove class
    $('.ui.savedTests.verticalTabMenu.segment').removeClass('loading');
    //then add the listeners for the buttons built into the form
    addTestTableButtonListeners();

}

//make sure the edit test project dropdown shows an updated account of the projects in storage
function refreshEditTestProjectDropdown() {

    //get the projects data from the database so we can have tests linked to projects
    StorageUtils.getAllObjectsInDatabaseTable('tests.js', 'projects')
        //once we have the array then we can start populating the new test form projects dropdwon by looping through the array
        .then(projectStorageArray => {

            //filter projects for default by fetching from local storage
            const defaultProjectId = Number(localStorage.getItem("DefaultProject"));
            //if we have any number greater than zero, which indicates no default, then filter
            defaultProjectId > 0 ? projectStorageArray = projectStorageArray.filter(project => project.id == defaultProjectId) : null;

            //get a reference to the drop down in the new test form
            var editTestDropDownMenu = $('.ui.fluid.selection.editTest.project.dropdown .menu');
            //empty the dropdown of existing items
            editTestDropDownMenu.empty();
            //use for-in loop as execution order is maintained to insert all the projects, with references, in the dropdown
            for (let project in projectStorageArray) {     
                //we are not going to use templates here as we are not dealing with complex html structures
                editTestDropDownMenu.append(`<div class="item" data-value=${projectStorageArray[project].id}>${projectStorageArray[project].projectName}</div>`);
            }
            //then after the entire loop has been executed we need to initialise the dropdown with the updated items
            $('.ui.fluid.selection.editTest.project.dropdown').dropdown();

        });  

}

function addTestTablePaginationListener() {

    $('.ui.testsTable .ui.pagination.menu .item').on('click', function(){

        //get the current page displayed, set to zero by default
        var currentPage = Number($('.ui.testsTable .ui.pagination.menu').attr('data-current-page'));
        //get the classes of the active item as a list
        const classArray = $(this).attr('class').split(/\s+/);
        //then get all the current tests from the database, as an array
        StorageUtils.getAllObjectsInDatabaseTable('tests.js', 'tests')
            //once we have the array then we can start populating the table by looping through the array
            .then(testStorageArray => {
                
                //filter tests for default project by fetching from local storage
                const defaultProjectId = Number(localStorage.getItem("DefaultProject"));
                //if we have any number greater than zero, which indicates no default, then filter
                defaultProjectId > 0 ? testStorageArray = testStorageArray.filter(test => test.testProjectId == defaultProjectId) : null;

                //then we paginate here using the class
                const paginator = new Pagination(testStorageArray);
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
                $('.ui.testsTable .ui.pagination.menu').attr('data-current-page', currentPage);
                //then set the storage array to the current page 
                testStorageArray = paginator.getParticularPage(currentPage);
                //then update the table
                addTestTableRowsFragment(testStorageArray);
                
        });

    });

}

function addTestTableButtonListeners() {

    //edit test button click handler
    $('.ui.testsTable.table .editTestLink').on('click', function(){
        
        //find the test in the database by id, using data-test-id from the template
        const testKey = $(this).attr("data-test-id");
        //the test key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('tests.js', testKey, 'tests')
            //then we have a returned js object with the test details
            .then(test => {

                //fill the hidden form field with the test id number, so we can retrieve after validation has been passed
                $('.ui.editTestForm.form input[name=hiddenTestId]').val(testKey);
                $('.ui.editTestForm.form input[name=hiddenTestCreated]').val(test.testCreated);

                //fill the form fields with the saved test data
                $('.ui.editTestForm.form input[name=testName]').val(test.testName);
                $('.ui.editTestForm.form input[name=testDescription]').val(test.testDescription);
                $('.ui.editTestForm.form input[name=testAuthor]').val(test.testAuthor);
                $('.ui.editTestForm.form input[name=testStartUrl]').val(test.testStartUrl);
       
                //then select the correct option from the select boxes - you use the data-value attribute rather than the text content
                $('.ui.editTestForm .ui.project.dropdown').dropdown('set selected', test.testProjectId.toString());
                $('.ui.editTestForm .ui.bandwidth.dropdown').dropdown('set selected', test.testBandwidthValue.toString());
                $('.ui.editTestForm .ui.latency.dropdown').dropdown('set selected', test.testLatencyValue.toString());

                //then check the check boxes according to values saved in the test data
                test.testPerformanceTimings == true ? $('.ui.editTestForm .ui.performance.checkbox').checkbox('set checked') : $('.ui.editTestForm .ui.performance.checkbox').checkbox('set unchecked');
                test.testResourceLoads == true ? $('.ui.editTestForm .ui.resource.checkbox').checkbox('set checked') : $('.ui.editTestForm .ui.resource.checkbox').checkbox('set unchecked');
                test.testScreenshot == true ? $('.ui.editTestForm .ui.screenshot.checkbox').checkbox('set checked') : $('.ui.editTestForm .ui.screenshot.checkbox').checkbox('set unchecked');
                test.testVisualRegression == true ? $('.ui.editTestForm .ui.regression.checkbox').checkbox('set checked') : $('.ui.editTestForm .ui.regression.checkbox').checkbox('set unchecked');

                //clear any success state from the form
                $('.ui.editTestForm.form').removeClass('success');
                //clear any error state from the form
                $('.ui.editTestForm.form').removeClass('error');

                //show the form
                $('.editTestFooter').css("display", "table-row");
            
            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));   

    });

    //delete test button click handler
    $('.ui.testsTable.table .deleteTestLink').on('dblclick', function(){
        
        //delete the test in the database, using data-test-id from the template
        const testKey = $(this).attr("data-test-id");
        //the test key will be in string format - StorageUtils handles conversion
        StorageUtils.deleteModelObjectInDatabaseTable('tests.js', testKey, 'tests')
            //then we have nothing returned
            .then( () => {
                //then redraw the table
                updateTestsTable();
                //then run the function that enables the buttons
                enableVerticalMenuButtonsWhenDataAllows();
            })
            //the delete single object function will reject if object is not in database
            .catch( () => console.error(`Error Deleting Test ${testKey}`));

    });

}

function updateTestsTable() {

    //first get all the current tests from the database, as an array, then loop through the array to update the UI
    StorageUtils.getAllObjectsInDatabaseTable('tests.js', 'tests')
        //once we have the array then we can start populating the table by looping through the array
        .then(testStorageArray => {

            //filter tests for default project by fetching from local storage
            const defaultProjectId = Number(localStorage.getItem("DefaultProject"));
            //if we have any number greater than zero, which indicates no default, then filter
            defaultProjectId > 0 ? testStorageArray = testStorageArray.filter(test => test.testProjectId == defaultProjectId) : null;

            //then we paginate here using the class
            const paginator = new Pagination(testStorageArray);
            //first we want to get the number of pages
            if (paginator.getTotalPagesRequired() > 1) {
                //then, if we have a number greater than 1 we need to build the paginator menu
                const menu = paginator.buildMenu(paginator.getTotalPagesRequired());
                //then grab the menu holder and empty it
                $('.ui.testsTable .paginationMenuHolder').empty();
                //then append our menu 
                $('.ui.testsTable .paginationMenuHolder').append(menu);
                //then show the menu holder
                $('.ui.testsTable .paginationMenuRow').css("display", "table-row");
                //then activate the buttons
                addTestTablePaginationListener();
            }
            //then make sure the table is showing the first page
            testStorageArray = paginator.getParticularPage(1);
            //then update the table
            addTestTableRowsFragment(testStorageArray);
        });

}

$(document).ready (function(){

    //make all the checkboxes for the edit test form ready
    $('.ui.editTestForm.form .ui.checkbox').checkbox();

    //ready the edit form bandwidth and latency dropdowns
    $('.ui.editTestForm.form .ui.fluid.selection.bandwidth.dropdown').dropdown({direction: 'upward'});
    $('.ui.editTestForm.form .ui.fluid.selection.latency.dropdown').dropdown({direction: 'upward'});

    //validation for the edit test form
    $('.ui.editTestForm.form')
        .form({
            on: 'blur',
            fields: {
                testName: {
                    identifier: 'testName',
                    rules: [
                        { type : 'empty', prompt : 'Please enter test name' }
                    ]
                },
                testStartUrl: {
                    identifier: 'testStartUrl',
                    rules: [
                        { type : 'empty', prompt : 'Please enter test start url' },
                        { type : 'regExp', value: /(?:^|\s)((https?:\/\/)?(?:localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?(\/\S*)?)/i, prompt : 'Please enter valid test start url' },
                    ]
                },
                testProject: {
                    identifier : 'testProject',
                    rules: [
                        { type : 'empty', prompt : 'Please select a project for test' }
                    ]
                },
                testBandwidth: {
                    identifier : 'testBandwidth',
                    rules: [
                        { type : 'empty', prompt : 'Please select a bandwidth value' }
                    ]
                },
                testLatency: {
                    identifier : 'testLatency',
                    rules: [
                        { type : 'empty', prompt : 'Please select a latency value' }
                    ]
                }
            },
            onSuccess(event, fields) {
                //always need to have this with a submit button otherwise the entire page reloads
                event.preventDefault();
                //add the loading indicator to the button, to indicate saving of the test to the database
                $('.ui.editTestForm ui.submit.button').addClass('loading');
                //just keep track of field names - they must be the same as model attributes when we create a new class object
                console.log(fields);
                //here we cannot do anything as simple as passing the fields to the model - we need a mix of things and we have to get the right format
                const editedTest = new Test({
                    //test name is OK, we just take it straight from fields
                    testName: fields.testName,
                    //test description also comes straight from fields - though not compulsory so it may be defaulted by model
                    testDescription: fields.testDescription,
                    //ditto with test author
                    testAuthor: fields.testAuthor,
                    //project ID is going to come as a field value from a drop down so it will be a string
                    //we need this as a number, so we can cross-reference easily in the database, use storage utils conversion for now
                    testProjectId: StorageUtils.standardiseKey(fields.testProjectId),
                    //project name is just a string, look up with jquery
                    testProjectName: $('.ui.editTestForm .ui.project.dropdown').dropdown('get text'),
                    //start url is also just a string that we pass straight from fields
                    testStartUrl: fields.testStartUrl,
                    //test bandwidth value is going to come as a field value from a drop down so it will be a string
                    //we need this as a number, so we can input easily into the network emulation in the debugger
                    testBandwidthValue: StorageUtils.standardiseKey(fields.testBandwidthValue),
                    //bandwidth name is just a string, look up with jquery
                    testBandwidthName: $('.ui.editTestForm .ui.bandwidth.dropdown').dropdown('get text'),
                    //test latency value is going to come as a field value from a drop down so it will be a string
                    //we need this as a number, so we can input easily into the network emulation in the debugger
                    testLatencyValue: StorageUtils.standardiseKey(fields.testLatencyValue),
                    //latency name is just a string, look up with jquery
                    testLatencyName: $('.ui.editTestForm .ui.latency.dropdown').dropdown('get text'),
                    //test created going to come as a field value down so it will be a string
                    testCreated: StorageUtils.standardiseKey(fields.hiddenTestCreated), 
                    //then the checkboxes, which unhelpfully deliver either 'on' string or false boolean - we need to convert all to boolean
                    testPerformanceTimings: fields.testPerformanceTimings == false ? false : true,
                    testResourceLoads: fields.testResourceLoads == false ? false : true,
                    testScreenshot: fields.testScreenShot == false && fields.testVisualRegression == false ? false : true,
                    testVisualRegression: fields.testVisualRegression == false ? false : true,
                });
                //then we need to save to the database
                StorageUtils.updateModelObjectInDatabaseTable('tests.js', fields.hiddenTestId, editedTest, 'tests')
                    //then we have nothing returned so we just make the adjustments
                    .then( () => {
                        //remove the loading indicator from the button, to indicate saving of the test to the database complete
                        $('.ui.editTestForm ui.submit.button').removeClass('loading');
                        //then redraw the table
                        updateTestsTable();
                        //clear the edit test form
                        $('.ui.editTestForm.form').form('clear');
                        //hide the edit test form container
                        $('.editTestFooter').css("display", "none");
                    });
            }

        });

});