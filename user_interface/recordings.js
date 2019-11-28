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

    //edit recording button click handler
    $('.showRecordingLink').on('mousedown', function(){
        //find the recording in the database by id, using data-recording-id from the template
        const recordingKey = $(this).attr("data-recording-id");
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('recordings.js', recordingKey, 'recordings')
            //then we have a returned js object with the recording details
            .then(recording => {
                //show the section that has the table in one tab and the code in another tab
                $('.ui.fluid.editRecording.container').css('display', 'block');
                //add the loading indicator to the table section
                $('.ui.fluid.editRecording.container .ui.bottom.attached.active.tab.segment ').addClass('loading');
                //update the checkboxes to have the current recording id                
                $('.ui.code.form .ui.radio.checkbox input[name="outputCodeType"]').attr('data-recording-id', recordingKey);
                //then update the edit recording events table
                updateRecordingEventsTableAndCodeText(recording);
                //then remove the loading indicator
                $('.ui.fluid.editRecording.container .ui.bottom.attached.active.tab.segment ').removeClass('loading');
            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));   

    });

    //edit recording button click handler
    $('.editRecordingLink').on('mousedown', function(){
        
        //find the recording in the database by id, using data-recording-id from the template
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
                //show the form
                $('.editRecordingFooter').css("display", "table-row");

            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));   

    });

    //delete recording button click handler
    $('.deleteRecordingLink').on('mousedown', function(){
        
        //close the edit recording form if it's open
        $('.editRecordingFooter').css("display", "none");
        //close the show recording / edit recording recordingEvents table
        $('.ui.fluid.editRecording.container').css('display', 'none');
        //delete the test in the database, using data-test-id from the template
        const recordingKey = $(this).attr("data-recording-id");
        //the test key will be in string format - StorageUtils handles conversion
        StorageUtils.deleteModelObjectInDatabaseTable('recordings.js', recordingKey, 'recordings')
            //then we have nothing returned
            .then( () => {
                //then redraw the table
                updateRecordingsTable();
            })
            //the delete single object function will reject if object is not in database
            .catch( () => console.error(`Error Deleting Recording ${recordingKey}`));

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

                let recordingShowLink = tempNode.querySelector('.showRecordingLink');
                recordingShowLink.setAttribute('data-recording-id', `${recordingStorageArray[recording].id}`);
                let recordingEditLink = tempNode.querySelector('.editRecordingLink');
                recordingEditLink.setAttribute('data-recording-id', `${recordingStorageArray[recording].id}`);
                let recordingDeleteLink = tempNode.querySelector('.deleteRecordingLink');
                recordingDeleteLink.setAttribute('data-recording-id', `${recordingStorageArray[recording].id}`);
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


function addRecordingEventTableButtonListeners() {

    //delete recording event button click handler
    $('.deleteRecordingEventRow').on('mousedown', function(){
        //close the event details form if it's open
        $('.viewDetailedTableEventsFooter').css("display", "none");
        //find the recording in the database by id, using data-recording-id from the template
        const recordingKey = $(this).attr("data-recording-id");
        //do the same with the recording event key
        const recordingEventKey = $(this).attr("data-recording-event-id");
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('recordings.js', recordingKey, 'recordings')
            //then we have a returned js object with the recording details
            .then(recording => {
                //get a new instantiation of our recording, which will lose the id
                var editedRecording = new Recording(recording);
                //add the id back so we can save using the id
                editedRecording.id = recording.id;
                //remove the deleted item and order according to time stamp, using the method attached to the recording model
                editedRecording.deleteRecordingEventById(recordingEventKey);
                //then update the events table so we can see the changes
                updateRecordingEventsTableAndCodeText(editedRecording);
                //then return the edited recording, with new set of events, for saving in the database
                return editedRecording;
            })
            //then we need to save the edited recording
            .then(editedRecording => StorageUtils.updateModelObjectInDatabaseTable('recordings.js', editedRecording.id, editedRecording, 'recordings'))
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));   

    });

    //delete recording event button click handler
    $('.showRecordingEventRow').on('mousedown', function(){
        //find the recording in the database by id, using data-recording-id from the template
        const recordingKey = $(this).attr("data-recording-id");
        //do the same with the recording event key
        const recordingEventKey = $(this).attr("data-recording-event-id");
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('recordings.js', recordingKey, 'recordings')
            //then we have a returned js object with the recording details
            .then(recording => {
                //get a new instantiation of our recording, so we can use the method
                var searchableRecording = new Recording(recording);
                //use the method to get the recording event
                const recordingEvent = searchableRecording.findRecordingEventById(recordingEventKey);
                //fill the form fields with the data from the recording event
                $('.ui.viewRecordingEvent.form input[name=recordingEventCssSelectorPath]').val(recordingEvent.recordingEventCssSelectorPath);
                $('.ui.viewRecordingEvent.form input[name=recordingEventCssDomPath]').val(recordingEvent.recordingEventCssDomPath);
                $('.ui.viewRecordingEvent.form input[name=recordingEventCssSimmerPath]').val(recordingEvent.recordingEventCssSimmerPath);
                $('.ui.viewRecordingEvent.form input[name=recordingEventXPath]').val(recordingEvent.recordingEventXPath);
                $('.ui.viewRecordingEvent.form input[name=recordingEventLocation]').val(recordingEvent.recordingEventLocation);
                //then the checkbox
                recordingEvent.recordingEventIsIframe == true ? $('.ui.viewRecordingEvent .ui.checkbox input[name=recordingEventIsIframe]').prop('checked', true) : $('.ui.viewRecordingEvent .ui.checkbox input[name=recordingEventIsIframe]').prop('checked', false);
                //then if the recording event is either a hover or a text select, we can fill the target strucure
                switch(true) {
                    case recordingEvent.recordingEventAction == 'Mouse' && recordingEvent.recordingEventActionType == 'hover':
                        //on each call we empty the list container we are using to create a dom structure
                        $('.recordingEventTargetStructureList').empty();
                        //then we deliver the pre-cooked html fragment from the Node builder, which loops through the DOM structure to create a tree
                        //we can use the same builder for recordings and replays just by adding the isReplay marker as false, which shows no assertion checkboxes
                        $('.recordingEventTargetStructureList').append(new NodeBuilder({isReplay: false}).build(recordingEvent.recordingEventHoverTargetAsJSON));
                        //then once it has been built, and added, then we are ready to show the display
                        $('.recordingEventTargetStructureDisplay').show();
                        break;
                    case recordingEvent.recordingEventAction == 'TextSelect' && recordingEvent.recordingEventActionType == 'selectstart':
                        //same thing here, with a different recording event property to work on
                        $('.recordingEventTargetStructureList').empty();
                        //the text selection has a slightly different collection method, separating the two for the time being allws more optionality, via properties passed to builder
                        $('.recordingEventTargetStructureList').append(new NodeBuilder({isReplay: false}).build(recordingEvent.recordingEventTextSelectTargetAsJSON));
                        //then once we have finished the processing, show the results
                        $('.recordingEventTargetStructureDisplay').show();
                        break;
                    default:
                        //if we are checking a recording event that is an action, rather than a hover or text selection, then we emoty the list container
                        $('.recordingEventTargetStructureList').empty();
                        //and we hide the segment that shows the list container as well
                        $('.recordingEventTargetStructureDisplay').hide();
                        //no need to supply a structure for elements we don't want to deliver assertions for
                        console.log("No JSON Structure saved for unassertable events")
                }
                //show the form and the structure div
                $('.viewDetailedTableEventsFooter').css("display", "table-row");
            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));   

    });

}

function updateRecordingEventsTableAndCodeText(recording) {

    //empty the table body first
    $('.ui.editRecordingRecordingEventsTable.table tbody').empty();
    //get a reference to the table
    const table = document.querySelector('.ui.editRecordingRecordingEventsTable.table tbody')
    //then for each recordingEvent we need to add it to the table and the textarea
    for (let recordingEvent in recording.recordingEventArray) { 
        //then borrow the function from newRecording.js
        console.log(recording.recordingEventArray[recordingEvent])
        addNewRecordingEventToTable(recording, recording.recordingEventArray[recordingEvent], table);
    }
    //for code, we use Javascript as default
    const toJavascript = new JavascriptTranslator({});
    $('.codeOutputTextArea').val(toJavascript.buildRecordingStringFromEvents(recording.recordingEventArray));
    //add recording events table button listeners
    addRecordingEventTableButtonListeners();

}

$(document).ready (function(){

    //activate the tab control
    $('.ui.top.attached.recording.tabular.menu .item').tab();

    //activate the copy to clipboard button
    $('.ui.copyCodeToClipBoard.icon.button').on('click', function() {
        //get the text from the text area
        const textToCopy = $('.codeOutputTextArea').val();
        //then paste that into the clipboard
        navigator.clipboard.writeText(textToCopy);
    });

    //activate the download code as js file button
    $('.ui.downloadCodeToFile.submit.button').on('click', function(event) {
        //make sure the submit button does not perform its usual reload function
        event.preventDefault();
        //get the text from the text area
        const textToCopy = $('.codeOutputTextArea').val();
        //create a blob from the text - maybe set this to "text/plain" when we no longer want to use vscode to check formatting of emitted code
        var blob = new Blob([textToCopy], {type: "text/javascript"});
        //create a local temporary url - the object URL can be used as download URL
        var url = URL.createObjectURL(blob);
        //then download
        chrome.downloads.download({
            url: url,
            filename: "RecordReplayRecording.js"
        });
    });

    //respond to requested code language changes, which requires getting the recording from the server and processing it
    $('.ui.code.form .ui.radio.checkbox').change(event => {
        //get the recording from the database using the key
        const recordingKey = event.target.getAttribute("data-recording-id");
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('recordings.js', recordingKey, 'recordings')
            //then depending up the recording, fill the code text
            .then(recording => {
                switch(true) {
                    case event.target.value == "javascript":
                        const toJavascript = new JavascriptTranslator({});
                        $('.codeOutputTextArea').val(toJavascript.buildRecordingStringFromEvents(recording.recordingEventArray));
                        break;
                    case event.target.value == "jquery":
                        const toJquery = new jQueryTranslator({}); 
                        $('.codeOutputTextArea').val(toJquery.buildRecordingStringFromEvents(recording.recordingEventArray));
                        break;
                    case event.target.value == "puppeteer":
                        const toPuppeteer = new PuppeteerTranslator({});
                        //we pass the whole recording to Puppeteer as it needs other values for set up
                        $('.codeOutputTextArea').val(toPuppeteer.buildRecordingStringFromEvents(recording));
                }
            });
    });

    //activate the form and validations
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
                //lets create an object that has fields compatible with database, remember the creation of a new recording will remove any keys that are not acceptable
                const adaptedFields = Object.assign({}, fields, { recordingIsMobile: fields.device == "mobile" ? true : false, recordingMobileOrientation: fields.orientation });
                //as we have lots of fields in a recording that are not displayed in the form, we need to get the recording from local storage, using the hidden field id
                StorageUtils.getSingleObjectFromDatabaseTable('recordings.js', fields.hiddenRecordingId, 'recordings')
                    //then map the object into a new object with the updated fields
                    .then(oldRecording => {
                        //this returns an amalgamated object to the following storage promise
                        return Object.assign({}, oldRecording, adaptedFields);
                    })
                    //then send the edited recording to the database for updating our recordings
                    .then(editedRecording => StorageUtils.updateModelObjectInDatabaseTable('recordings.js', fields.hiddenRecordingId, editedRecording, 'recordings') )
                    //then do all the user interface stuff that needs doing
                    .then(() => {
                        //remove the loading indicator from the button, to indicate saving of the recording to the database complete
                        $('.ui.editRecordingForm .ui.submit.button').removeClass('loading');
                        //then redraw the table
                        updateRecordingsTable();
                        //clear the edit test form
                        $('.ui.editRecordingForm.form').form('clear');
                        //hide the edit test form container
                        $('.editRecordingFooter').css("display", "none");
                    })
                    .catch( () => console.error(`Error Updating Recording ${fields.hiddenRecordingId}`));
                
            }

        });

});