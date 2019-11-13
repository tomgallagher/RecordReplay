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

    //TO DO - get all the current projects from the database, as an array, then loop through the array to update the UI

    //ALL FOLLOWS INSIDE LOOP
    //for (let item in projectStorageArray) { console.log(item); }

    
    //then we make a clone of the row, that will serve the purpose
    let tempNode = targetRow.cloneNode(true);
    
    //then we need to find each of the elements of the template that need to be adjusted and input from the current project
        
    //tempNode child <td data-label="testName"></td> needs to have text content set to database testName
    let testNameNode = tempNode.querySelector('td[data-label="testName"]');
    testNameNode.textContent = "big";
    
    //tempNode child <td data-label="testDescription"></td> needs to have text content set to database testDescription
    let testDescriptionNode = tempNode.querySelector('td[data-label="testDescription"]');
    testDescriptionNode.textContent = "hairy";

    //tempNode child <td data-label="testAuthor"></td> needs to have text content set to database testAuthor
    let testAuthorNode = tempNode.querySelector('td[data-label="testAuthor"]');
    testAuthorNode.textContent = "monsters";

    //tempNode child <td data-label="projectName"></td> needs to have text content set to database projectName
    let testProjectNode = tempNode.querySelector('td[data-label="projectName"]');
    testProjectNode.textContent = "Some Other Project";

    //tempNode child <td data-label="testStartUrl"></td> needs to have text content set to database testStartUrl
    let testUrlNode = tempNode.querySelector('td[data-label="testStartUrl"]');
    testUrlNode.textContent = "https://www.example2.com";

    //tempNode child <td data-label="testBandwidth"></td> needs to have text content set to database testBandwidth
    let testBandWidthNode = tempNode.querySelector('td[data-label="testBandwidth"]');
    testBandWidthNode.textContent = "3 Mbps";

    //tempNode child <td data-label="testLatency"></td> needs to have text content set to database testLatency
    let testLatencyNode = tempNode.querySelector('td[data-label="testLatency"]');
    testLatencyNode.textContent = "150ms";

    //tempNode child <td data-label="testAdditionalReporting"></td> needs to have text content set to database testAdditionalReporting
    let testAdditionalReportingNode = tempNode.querySelector('td[data-label="testAdditionalReporting"]');
    testAdditionalReportingNode.textContent = "Take Screenshot";

    //tempNode child <button class="ui editTest button" data-test-id="0"></button> needs to have data-test-id set to the database id
    let testEditButton = tempNode.querySelector('.ui.editTest.button');
    testEditButton.setAttribute('data-test-id', 'Hello World!');

    //tempNode child <button class="ui deleteTest negative button" data-test-id="0" data-tooltip="To delete test and all associated recordings and replays"></button> needs to have data-test-id set to the database id
    let testDeleteButton = tempNode.querySelector('.ui.deleteTest.button');
    testDeleteButton.setAttribute('data-test-id', 'GoodBye World!');

    //then we need to attach the clone of the template node to our container fragment
    docFrag.appendChild(tempNode);

    //then we find the relevant table, using docuement.querySelector which helpfully returns the first Element within the document that matches the specified selector - MAYBE OUTSIDE LOOP
    let projectsTable = document.querySelector('.ui.celled.testsTable.table tbody');
    
    //then we append each of the project fragments to the table - MAYBE OUTSIDE LOOP
    projectsTable.appendChild(docFrag);
    
    //then once all the work has been done remove class - OUTSIDE LOOP
    $('.ui.savedTests.verticalTabMenu.segment').removeClass('loading');

}

$(document).ready (function(){

    //edit test button click handler
    $('.ui.editTest.button').on('mousedown', function(){
        //TODO find the test in the database by id, using data-test-id from the template

        //fill the form fields with the saved test data
        $('.ui.editTestForm.form input[name=testName]').val('big');
        $('.ui.editTestForm.form input[name=testDescription]').val('hairy');
        $('.ui.editTestForm.form input[name=testAuthor]').val('monsters');
        $('.ui.editTestForm.form input[name=testStartUrl]').val('http://www.example.com');
       
        //then select the correct option from the select boxes - you use the data-value attribute rather than the text content
        $('.ui.editTestForm .ui.project.dropdown').dropdown('set selected', "1");
        $('.ui.editTestForm .ui.bandwidth.dropdown').dropdown('set selected', "187500");
        $('.ui.editTestForm .ui.latency.dropdown').dropdown('set selected', "40");

        //then check the check boxes according to values saved in the test data
        $('.ui.editTestForm .ui.performance.checkbox').checkbox('set checked');
        $('.ui.editTestForm .ui.resource.checkbox').checkbox('set checked');
    
        //show the form
        $('.editTestFooter').css("display", "table-footer-group");

    });

    //delete project button click handler
    $('.ui.deleteTest.button').on('mousedown', function(){
        
        //delete the test in the database, using data-test-id from the template

        //then redraw the table
        updateTestsTable();
    });

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
                event.preventDefault();
                console.log(fields);
                //clear the edit project form
                $('.ui.editTestForm.form').form('clear');
                //hide the edit project form container
                $('.editTestFooter').css("display", "none");
                //TO DO we need to redraw the table as well here, after we have saved changes
            }
        });

});