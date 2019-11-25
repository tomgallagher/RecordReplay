function addNewRecordingEventToTable(recording, recordingEvent, table) {

    //target our table row template first, we only need to find the template once
    let targetNode = document.querySelector('.recordingEventTableRowTemplate');
    //we need to do more work as we have to save the template in a table, which we don't need, we just want the row
    let targetRow = targetNode.querySelector('tr');
    //then create a document fragment that we will use as a container for each looped template
    let docFrag = document.createDocumentFragment();
    //then we make a clone of the row, that will serve the purpose
    let tempNode = targetRow.cloneNode(true);

    //then we just take the data from the recording event and paste it in
    //<td data-field="recordingEventOrigin">User</td>
    let recordingEventOriginNode = tempNode.querySelector('td[data-label="recordingEventOrigin"]');
    recordingEventOriginNode.textContent = recordingEvent.recordingEventOrigin;
    //<td data-field="recordingEventAction">Click</td>
    let recordingEventActionNode = tempNode.querySelector('td[data-label="recordingEventAction"]');
    recordingEventActionNode.textContent = recordingEvent.recordingEventAction;
    //<td data-label="recordingEventActionType">Click</td>
    let recordingEventActionTypeNode = tempNode.querySelector('td[data-label="recordingEventActionType"]');
    recordingEventActionTypeNode.textContent = recordingEvent.recordingEventActionType;
    //<td data-field="recordingEventHTMLTag">BUTTON</td>
    let recordingEventHTMLTagNode = tempNode.querySelector('td[data-label="recordingEventHTMLTag"]');
    recordingEventHTMLTagNode.textContent = recordingEvent.recordingEventHTMLTag;
    //<td data-label="recordingEventCssSelectorPath" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">div > a</td>
    let recordingEventSelectorNode = tempNode.querySelector('td[data-label="recordingEventCssSelectorPath"]');
    recordingEventSelectorNode.textContent = recordingEvent.recordingEventCssSelectorPath || recordingEvent.recordingEventCssDomPath;
    //<td data-field="recordingEventInputType">N/A</td>
    let recordingEventInputTypeNode = tempNode.querySelector('td[data-label="recordingEventInputType"]');
    recordingEventInputTypeNode.textContent = recordingEvent.recordingEventInputType;
    //<td data-field="recordingEventInputValue" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">N/A</td>
    let recordingEventInputValueNode = tempNode.querySelector('td[data-label="recordingEventInputValue"]');
    recordingEventInputValueNode.textContent = recordingEvent.recordingEventInputValue;
    //<td data-field="recordingEventLocation" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">https://www.example.com</td>
    let recordingEventLocationNode = tempNode.querySelector('td[data-label="recordingEventLocation"]');
    recordingEventLocationNode.textContent = recordingEvent.recordingEventLocation;
    //<td data-field="recordingEventCreated">Some time</td>
    let recordingEventCreatedNode = tempNode.querySelector('td[data-label="recordingEventCreated"]');
    recordingEventCreatedNode.textContent = recordingEvent.recordingTimeSincePrevious == 0 ? new Date(recordingEvent.recordingEventCreated).toLocaleString() : `+ ${Math.ceil(recordingEvent.recordingTimeSincePrevious / 1000)} sec`

    let recordingEventShowLink = tempNode.querySelector('.showRecordingEventRow');
    recordingEventShowLink.setAttribute('data-recording-event-id', `${recordingEvent.recordingEventId}`);
    recordingEventShowLink.setAttribute('data-recording-id', `${recording.id}`);

    let recordingEventDeleteLink = tempNode.querySelector('.deleteRecordingEventRow');
    recordingEventDeleteLink.setAttribute('data-recording-event-id', `${recordingEvent.recordingEventId}`);
    recordingEventDeleteLink.setAttribute('data-recording-id', `${recording.id}`);

    //then we need to attach the clone of the template node to our container fragment
    docFrag.appendChild(tempNode);
    //then we append the fragment to the table
    table.appendChild(docFrag);    

}

function addStartRecordingHandler() {

    //RECORDING START HANDLER
    Rx.Observable.fromEvent(document.querySelector('.ui.startRecording.positive.button'), 'click')
        //make the changes to the ui to indicate that we have started
        .do(event => {
            //show the start recording button as disabled
            event.target.className += " disabled";
            //show the recording loader
            $('.ui.text.small.recording.loader').addClass('active');
            //then empty the table
            $('.ui.celled.striped.newRecordingRecordingEventsTable.table tbody').empty();
        })
        //map the event to the recording that has started by querying storage using the data id from the button
        .flatMap(event => Rx.Observable.fromPromise(StorageUtils.getSingleObjectFromDatabaseTable('newRecording.js', event.target.getAttribute('data-recording-id') , 'recordings')))
        //we need to instruct background script to start the tab with the recording 
        .do(recording => new RecordReplayMessenger({}).sendMessage({newRecording: recording}))
        //then we create a recording messenger that updates its active recording each time there is a message emitted
        .switchMap( () =>
            //then we need to start receiving recording events sent here by the content script, either originating in the content script or relayed from window.postMessage iframe
            new RecordReplayMessenger({}).isAsync(false).chromeOnMessageObservable,
            //then use the projection function to tie the two together
            (recording, messageObject) => {
                //add the recording event to the table
                addNewRecordingEventToTable(recording, messageObject.request.recordingEvent, document.querySelector('.ui.celled.striped.newRecordingRecordingEventsTable.table tbody'))
                //push the new recording event into the recording's event array
                recording.recordingEventArray.push(messageObject.request.recordingEvent);
                //then return the recording so it can be updated in the database
                return recording;
            }
        )
        //we only want to make additions until the user interface stop recording button is clicked 
        //TO DO - WE PROBABLY WANT TO STOP RECORDING WHEN BROWSER WINDOW IS CLOSED AS WELL
        .takeUntil(Rx.Observable.fromEvent(document.querySelector('.ui.stopRecording.negative.button'), 'click'))
        //change the user interface
        .subscribe(
            //when we get each mutated recording emitted, we need to update the recording in the database with its new recording event array
            editedRecording => {
                //log to the console so we can follow what's going on
                console.log(editedRecording);
                //then update the recording in the database
                StorageUtils.updateModelObjectInDatabaseTable('recordings.js', editedRecording.id, editedRecording, 'recordings');
            },
            error => console.error(error),
            //when complete we want to update the UI
            () => {  
                //hide the recording loader
                $('.ui.text.small.recording.loader').removeClass('active');

                //TO DO send message to close the recording tab
                
                //then we need to add the start recording handler again
                addStartRecordingHandler();
            }
        );

}

function refreshNewRecordingTestDropdown() {

    //get the tests data from the database so we can have recordings linked to tests
    StorageUtils.getAllObjectsInDatabaseTable('newRecording.js', 'tests')
        //once we have the array then we can start populating the new test form projects dropdwon by looping through the array
        .then(testStorageArray => {
            
            //get a reference to the drop down in the new recording form
            var newRecordingDropDownMenu = $('.ui.fluid.selection.newRecording.test.dropdown .menu');
            //empty the dropdown of existing items
            newRecordingDropDownMenu.empty();
            //use for-in loop as execution order is maintained to insert all the tests, with references, in the dropdown
            for (let test in testStorageArray) {     
                //we are not going to use templates here as we are not dealing with complex html structures
                newRecordingDropDownMenu.append(`<div class="item" data-value=${testStorageArray[test].id}>${testStorageArray[test].testName}</div>`);
            }
            //then after the entire loop has been executed we need to initialise the dropdown with the updated items
            $('.ui.fluid.selection.newRecording.test.dropdown').dropdown({
                onChange: function(value) {
                    //data value always returns a string and we need the id in number form
                    const testId = Number(value);
                    //then we need to get the right item from the array so we can populate the test start url field in the visible form
                    const test = testStorageArray.find(item => item.id == testId);
                    //populate the visible form but leave it disabled - it's readable but the form does not mutate and require reseting
                    $('.ui.newRecordingForm.form input[name=recordingTestStartUrl]').val(test.testStartUrl);
                }

            });

        });  

}


$(document).ready (function(){

    //then we need to add the start recording handler
    addStartRecordingHandler();

    //just need a simple handler for the check box to state computer or mobile emulation
    $('.ui.newRecordingForm.form .ui.radio.device.checkbox').change(function(event){
        if (event.target.value == "mobile") {
            $('.ui.newRecordingForm.form .orientation.field').removeClass('disabled');
        } else { 
            $('.ui.newRecordingForm.form .orientation.field').addClass('disabled'); 
        }
    });

    $('.ui.newRecordingForm.form')
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
                //add the loading indicator to the button, to indicate saving of the test to the database
                $('.ui.newRecordingForm .ui.submit.button').addClass('loading');
                //just keep track of field names - they must be the same as model attributes when we create a new class object
                console.log(fields);
                // eg { computer: "on", landscape: false, mobile: false, portrait: "on", recordingAuthor: "", recordingDescription: "", recordingName: "efe", recordingTestId: "1", recordingTestStartUrl: "https://turbobrowser.eu/" }
                // so we need to merge the recording with its matched test
                StorageUtils.getSingleObjectFromDatabaseTable('newRecording.js', fields.recordingTestId, 'tests')
                    //then we have a returned js object with the test details
                    .then(test => {
                        //create our new recording object
                        const newRecording =  new Recording({
                            //displayed fields from form 
                            recordingName: fields.recordingName,
                            recordingDescription: fields.recordingDescription || "N/A",
                            recordingAuthor: fields.recordingDescription || "N/A",
                            recordingIsMobile: fields.device == "computer" ? false : true,
                            recordingMobileOrientation: fields.orientation,
                            recordingTestStartUrl: fields.recordingTestStartUrl,
                            //inherited defaults from storage table queried by string recordingTestId selection drop down
                            recordingProjectId: test.testProjectId,
                            recordingProjectName: test.testProjectName,
                            recordingTestId: test.id,
                            recordingTestName: test.testName,
                            recordingTestBandwidthValue: test.testBandwidthValue,
                            recordingTestBandwidthName: test.testBandwidthName,
                            recordingTestLatencyValue: test.testLatencyValue,
                            recordingTestLatencyName: test.testLatencyName,
                            recordingTestPerformanceTimings: test.testPerformanceTimings,
                            recordingTestResourceLoads: test.testResourceLoads,
                            recordingTestScreenshot: test.testScreenshot,
                        });
                        console.log(newRecording);
                        //then we need to save to the database
                        StorageUtils.addModelObjectToDatabaseTable('newRecording.js', newRecording, 'recordings')
                            //which does not return anything but we don't need it as we fetch from database directly to update the projects table
                            .then(createdRecordingId => {
                                //remove the loading indicator from the button
                                $('.ui.newRecordingForm .ui.submit.button').removeClass('loading');
                                //clear the new recording recording events table of any previous entries
                                $('.ui.celled.newRecordingRecordingEventsTable.table tbody').empty();
                                //undisable the button if we have had a previous new recording
                                $('.ui.startRecording.positive.button').removeClass('disabled');
                                //change the data-recording-id of the start and stop buttons, so we can retrieve the recording on recording start
                                $('.ui.startRecording.positive.button, .ui.stopRecording.negative.button').attr("data-recording-id", createdRecordingId);
                                //show the recording events segment
                                $('.ui.recordingEvents.segment').css('display', 'block');
                                //then run the function that enables the buttons
                                enableVerticalMenuButtonsWhenDataAllows();
                        });

                    });
                
            }

        });
    
});