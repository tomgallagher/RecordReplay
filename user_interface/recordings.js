//make sure the edit test project dropdown shows an updated account of the projects in storage
function refreshEditRecordingTestDropdown() {

    //get the projects data from the database so we can have tests linked to projects
    StorageUtils.getAllObjectsInDatabaseTable('recordings.js', 'tests')
        //once we have the array then we can start populating the new test form projects dropdwon by looping through the array
        .then(testStorageArray => {

            //get a reference to the drop down in the new test form
            var editRecordingDropDownMenu = $('.ui.fluid.selection.editRecording.test.dropdown .menu');
            //empty the dropdown of existing items
            editRecordingDropDownMenu.empty();
            //use for-in loop as execution order is maintained to insert all the tests, with references, in the dropdown
            for (let test in testStorageArray) {     
                //we are not going to use templates here as we are not dealing with complex html structures
                editRecordingDropDownMenu.append(`<div class="item" data-value=${testStorageArray[test].id}>${testStorageArray[test].testName}</div>`);
            }
            //then after the entire loop has been executed we need to initialise the dropdown with the updated items
            $('.ui.fluid.selection.editRecording.test.dropdown').dropdown();

        });  

}

function addRecordingTableButtonListeners() {

    //edit test button click handler
    $('.ui.editRecording.button:not(submit)').on('mousedown', function(){
        
        //find the test in the database by id, using data-test-id from the template
        const recordingKey = $(this).attr("data-recording-id");
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('recordings.js', recordingKey, 'recordings')
            //then we have a returned js object with the recording details
            .then(recording => {

                //fill the hidden form field with the recording id number, so we can retrieve after validation has been passed
                $('.ui.editRecordingForm.form input[name=hiddenRecordingId]').val(recordingKey);
                //fill the form fields with the saved recording data
                $('.ui.editRecordingForm.form input[name=recordingName]').val(recording.recordingName);
                $('.ui.editRecordingForm.form input[name=recordingDescription]').val(recording.recordingDescription);
                $('.ui.editRecordingForm.form input[name=recordingAuthor]').val(recording.recordingAuthor);
                $('.ui.editRecordingForm.form input[name=recordingTestStartUrl]').val(recording.recordingTestStartUrl);

                //then select the correct dropdown for the recordings related test
                $('.ui.editRecordingForm .ui.test.dropdown').dropdown('set selected', recording.recordingTestId);

                //RADIO BUTTONS
                recording.recordingIsMobile == false ? $('.ui.editRecordingForm .ui.radio.device.checkbox input[value=computer]').prop('checked', true) : null;
                recording.recordingIsMobile == false ? $('.ui.editRecordingForm.form .orientation.field').addClass('disabled') : null;
                recording.recordingIsMobile == false ? $('.ui.editRecordingForm .ui.radio.checkbox input[value=portrait]').prop('checked', true) : null;

                recording.recordingIsMobile == true ? $('.ui.editRecordingForm .ui.radio.device.checkbox input[value=mobile]').prop('checked', true) : null;
                recording.recordingIsMobile == true ? $('.ui.editRecordingForm.form .orientation.field').removeClass('disabled') : null;
                recording.recordingIsMobile == true && recording.recordingMobileOrientation == 'landscape' ? $('.ui.editRecordingForm .ui.radio.checkbox input[value=landscape]').prop('checked', true) : null;

                //clear any success state from the form
                $('.ui.editRecordingForm.form').removeClass('success');
                //clear any error state from the form
                $('.ui.editRecordingForm.form').removeClass('error');

                //TODO show the table for the recording events so it can be edited
                //if (recording.recordingEventArray.length > 0) {

                    

                //}

                //show the form
                $('.editRecordingFooter').css("display", "table-footer-group");

            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));   

    });

}

function updateRecordingsTable() {

    //add the loading indicator to the segment
    $('.ui.savedRecordings.verticalTabMenu.segment').addClass('loading');
    //empty the recordings table body so we can add the updated information
    $('.ui.celled.recordingsTable.table tbody').empty();
    //target our table row template first, we only need to find the template once
    let targetNode = document.querySelector('.recordingTableRowTemplate');
    //we need to do more work as we have to save the template in a table, which we don't need, we just want the row
    let targetRow = targetNode.querySelector('tr');
    //then create a document fragment that we will use as a container for each looped template
    let docFrag = document.createDocumentFragment();

    //first get all the current recordings from the database, as an array, then loop through the array to update the UI
    StorageUtils.getAllObjectsInDatabaseTable('recordings.js', 'recordings')
        //once we have the array then we can start populating the table by looping through the array
        .then(recordingStorageArray => {

            //use for-in loop as execution order is maintained
            for (let recording in recordingStorageArray) { 

                //then we make a clone of the row, that will serve the purpose
                let tempNode = targetRow.cloneNode(true);
                //then we need to find each of the elements of the template that need to be adjusted and input from the current project
                let recordingNameNode = tempNode.querySelector('td[data-label="recordingName"]');
                recordingNameNode.textContent = recordingStorageArray[recording].recordingName;
                let recordingDescriptionNode = tempNode.querySelector('td[data-label="recordingDescription"]');
                recordingDescriptionNode.textContent = recordingStorageArray[recording].recordingDescription;
                let recordingAuthorNode = tempNode.querySelector('td[data-label="recordingAuthor"]');
                recordingAuthorNode.textContent = recordingStorageArray[recording].recordingAuthor;
                let recordingProjectNode = tempNode.querySelector('td[data-label="recordingProjectName"]');
                recordingProjectNode.textContent = recordingStorageArray[recording].recordingProjectName;
                let recordingTestNode = tempNode.querySelector('td[data-label="recordingTestName"]');
                recordingTestNode.textContent = recordingStorageArray[recording].recordingTestName; 
                let recordingStartUrlNode = tempNode.querySelector('td[data-label="recordingTestStartUrl"]');
                recordingStartUrlNode.textContent = recordingStorageArray[recording].recordingTestStartUrl; 
                let recordingAdditionalReportingNode = tempNode.querySelector('td[data-label="recordingAdditionalReporting"]');
                var additionalReportsArray = [];
                recordingStorageArray[recording].recordingIsMobile == true ? additionalReportsArray.push('Mobile') : additionalReportsArray.push('Computer');
                recordingStorageArray[recording].recordingIsMobile == true ? additionalReportsArray.push(recordingStorageArray[recording].recordingMobileOrientation) : null;
                recordingAdditionalReportingNode.textContent = additionalReportsArray.join(', ');

                let recordingEditButton = tempNode.querySelector('.ui.editRecording.button');
                recordingEditButton.setAttribute('data-recording-id', `${recordingStorageArray[recording].id}`);
                let recordingDeleteButton = tempNode.querySelector('.ui.deleteRecording.button');
                recordingDeleteButton.setAttribute('data-recording-id', `${recordingStorageArray[recording].id}`);
                //then we need to attach the clone of the template node to our container fragment
                docFrag.appendChild(tempNode);
            
            }
            
            //then after the entire loop has been executed we need to adjust the dom in one hit, avoid performance issues with redraw
            //then we find the relevant table, using docuement.querySelector which helpfully returns the first Element within the document that matches the specified selector
            let recordingsTable = document.querySelector('.ui.celled.recordingsTable.table tbody');
            //then we append the fragment to the table
            recordingsTable.appendChild(docFrag);
            //then once all the work has been done remove class
            $('.ui.savedRecordings.verticalTabMenu.segment').removeClass('loading');
            //then add the listeners for the buttons built into the form
            addRecordingTableButtonListeners();

        });

}

$(document).ready (function(){

    $('.ui.editRecordingForm.form')
        .form({
            on: 'blur',
            fields: {
                recordingName: {
                    identifier: 'recordingName',
                    rules: [
                        { type : 'empty', prompt : 'Please enter recording name' }
                    ]
                },
                recordingTestId: {
                    identifier : 'recordingTestId',
                    rules: [
                        { type : 'empty', prompt : 'Please select a test for recording' }
                    ]
                },
                recordingTestStartUrl: {
                    identifier : 'recordingTestStartUrl',
                    rules: [
                        { type : 'empty', prompt : 'Please enter test start url by selecting a test' }
                    ]
                },
            },
            onSuccess(event, fields) {
                //always need to have this with a submit button otherwise the entire page reloads
                event.preventDefault();
                //add the loading indicator to the button, to indicate saving of the recording to the database
                $('.ui.editRecordingForm .ui.submit.button').addClass('loading');
                //just keep track of field names - they must be the same as model attributes when we create a new class object
                console.log(fields);

                $('.ui.editRecordingForm .ui.submit.button').removeClass('loading');
            }

        });

});