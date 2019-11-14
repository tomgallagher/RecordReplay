//make sure the edit test project dropdown shows an updated account of the projects in storage
function refreshEditTestProjectDropdown() {

    //get the projects data from the database so we can have tests linked to projects
    StorageUtils.getAllObjectsInDatabaseTable('tests.js', 'projects')
        //once we have the array then we can start populating the new test form projects dropdwon by looping through the array
        .then(projectStorageArray => {

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

function addTestTableButtonListeners() {

    //edit test button click handler
    $('.ui.editTest.button:not(submit)').on('mousedown', function(){
        
        //find the test in the database by id, using data-test-id from the template
        const testKey = $(this).attr("data-test-id");
        //the project key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('tests.js', testKey, 'tests')
            //then we have a returned js object with the project details
            .then(test => {

                //fill the hidden form field with the test id number, so we can retrieve after validation has been passed
                $('.ui.editTestForm.form input[name=hiddenTestId]').val(testKey);

                //fill the form fields with the saved test data
                $('.ui.editTestForm.form input[name=testName]').val(test.testName);
                $('.ui.editTestForm.form input[name=testDescription]').val(test.testDescription);
                $('.ui.editTestForm.form input[name=testAuthor]').val(test.testAuthor);
                $('.ui.editTestForm.form input[name=testStartUrl]').val(test.testStartUrl);
       
                //then select the correct option from the select boxes - you use the data-value attribute rather than the text content
                $('.ui.editTestForm .ui.project.dropdown').dropdown('set selected', test.testProjectId);
                $('.ui.editTestForm .ui.bandwidth.dropdown').dropdown('set selected', test.testBandwidthValue);
                $('.ui.editTestForm .ui.latency.dropdown').dropdown('set selected', test.testLatencyValue);

                //then check the check boxes according to values saved in the test data
                test.testPerformanceTimings == true ? $('.ui.editTestForm .ui.performance.checkbox').checkbox('set checked') : null;
                test.testResourceLoads == true ? $('.ui.editTestForm .ui.resource.checkbox').checkbox('set checked') : null;
                test.testScreenshot == true ? $('.ui.editTestForm .ui.screenshot.checkbox').checkbox('set checked') : null;
       
                //clear any success state from the form
                $('.ui.editTestForm.form').removeClass('success');
                //clear any error state from the form
                $('.ui.editTestForm.form').removeClass('error');

                //show the form
                $('.editTestFooter').css("display", "table-footer-group");
            
            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));   

    });

    //delete project button click handler
    $('.ui.deleteTest.button').on('mousedown', function(){
        
        //delete the test in the database, using data-test-id from the template
        const testKey = $(this).attr("data-test-id");
        //the test key will be in string format - StorageUtils handles conversion
        StorageUtils.deleteModelObjectInDatabaseTable('tests.js', testKey, 'tests')
            //then we have nothing returned
            .then( () => {
                //then redraw the table
                updateTestsTable();
            })
            //the delete single object function will reject if object is not in database
            .catch( () => console.error(`Error Deleting Test ${testKey}`));

    });

}

function updateTestsTable() {

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

    //first get all the current tests from the database, as an array, then loop through the array to update the UI
    StorageUtils.getAllObjectsInDatabaseTable('tests.js', 'tests')
        //once we have the array then we can start populating the table by looping through the array
        .then(testStorageArray => {

            //use for-in loop as execution order is maintained
            for (let test in testStorageArray) { 

                //then we make a clone of the row, that will serve the purpose
                let tempNode = targetRow.cloneNode(true);
                //then we need to find each of the elements of the template that need to be adjusted and input from the current project
                //tempNode child <td data-label="testName"></td> needs to have text content set to database testName
                let testNameNode = tempNode.querySelector('td[data-label="testName"]');
                testNameNode.textContent = testStorageArray[test].testName;
                //tempNode child <td data-label="testDescription"></td> needs to have text content set to database testDescription
                let testDescriptionNode = tempNode.querySelector('td[data-label="testDescription"]');
                testDescriptionNode.textContent = testStorageArray[test].testDescription;
                //tempNode child <td data-label="testAuthor"></td> needs to have text content set to database testAuthor
                let testAuthorNode = tempNode.querySelector('td[data-label="testAuthor"]');
                testAuthorNode.textContent = testStorageArray[test].testAuthor;
                //tempNode child <td data-label="projectName"></td> needs to have text content set to database projectName
                let testProjectNode = tempNode.querySelector('td[data-label="projectName"]');
                testProjectNode.textContent = testStorageArray[test].testProjectName;     
                //tempNode child <td data-label="testStartUrl"></td> needs to have text content set to database testStartUrl
                let testUrlNode = tempNode.querySelector('td[data-label="testStartUrl"]');
                testUrlNode.textContent = testStorageArray[test].testStartUrl;
                //tempNode child <td data-label="testBandwidth"></td> needs to have text content set to database testBandwidth
                let testBandWidthNode = tempNode.querySelector('td[data-label="testBandwidth"]');
                testBandWidthNode.textContent = testStorageArray[test].testBandwidthName;
                //tempNode child <td data-label="testLatency"></td> needs to have text content set to database testLatency
                let testLatencyNode = tempNode.querySelector('td[data-label="testLatency"]');
                testLatencyNode.textContent = testStorageArray[test].testLatencyName;
                //tempNode child <td data-label="testAdditionalReporting"></td> needs to have text content set to database testAdditionalReporting
                let testAdditionalReportingNode = tempNode.querySelector('td[data-label="testAdditionalReporting"]');
                //we need to combine the booleans into a comma separated string indicating extra values
                var additionalReportsArray = [];
                testStorageArray[test].testPerformanceTimings == true ? additionalReportsArray.push('Performance Timings') : null;
                testStorageArray[test].testResourceLoads == true ? additionalReportsArray.push('Resource Loads') : null;
                testStorageArray[test].testScreenshot == true ? additionalReportsArray.push('Take Screenshot') : null;
                testAdditionalReportingNode.textContent = additionalReportsArray.join(',');
                //tempNode child <button class="ui editTest button" data-test-id="0"></button> needs to have data-test-id set to the database id
                let testEditButton = tempNode.querySelector('.ui.editTest.button');
                testEditButton.setAttribute('data-test-id', `${testStorageArray[test].id}`);
                //tempNode child <button class="ui deleteTest negative button" data-test-id="0" data-tooltip="To delete test and all associated recordings and replays"></button> needs to have data-test-id set to the database id
                let testDeleteButton = tempNode.querySelector('.ui.deleteTest.button');
                testDeleteButton.setAttribute('data-test-id', `${testStorageArray[test].id}`);
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

        });

}

$(document).ready (function(){

    //make all the checkboxes for the edit test form ready
    $('.ui.editTestForm.form .ui.checkbox').checkbox();

    //ready the edit form bandwidth and latency dropdowns
    $('.ui.editTestForm.form .ui.fluid.selection.bandwidth.dropdown').dropdown();
    $('.ui.editTestForm.form .ui.fluid.selection.latency.dropdown').dropdown();

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
                    //then the checkboxes, which unhelpfully deliver either 'on' string or false boolean - we need to convert all to boolean
                    testPerformanceTimings: fields.testPerformanceTimings == false ? false : true,
                    testResourceLoads: fields.testResourceLoads == false ? false : true,
                    testScreenshot: fields.testScreenShot == false ? false : true
                });
                //then we need to save to the database
                StorageUtils.updateModelObjectInDatabaseTable('tests.js', fields.hiddenTestId, editedTest, 'tests')
                    //then we have nothing returned so we just make the adjustments
                    .then( () => {
                        //remove the loading indicator from the button, to indicate saving of the project to the database complete
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