//THIS FUNCTION IS SHARED BY RECORDINGS.JS
//CHECK BOTH FILES BEFORE MAKING CHANGES
function addNewRecordingEventToTable(recording, recordingEvent, table) {

    //target our table row template first, we only need to find the template once
    let targetNode = document.querySelector('.recordingEventTableRowTemplate');
    //we need to do more work as we have to save the template in a table, which we don't need, we just want the row
    let targetRow = targetNode.querySelector('tr');
    //then create a document fragment that we will use as a container for each looped template
    let docFrag = document.createDocumentFragment();
    //then we make a clone of the row, that will serve the purpose
    let tempNode = targetRow.cloneNode(true);

    //if the event has taken place in an iframe we add the warning class
    if (recordingEvent.recordingEventIsIframe) { tempNode.classList.add('warning');}
    //if the event has been passed in from the web navigator then we show it as disabled
    if (recordingEvent.recordingEventAction == "Page") { tempNode.classList.add('disabled');}

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
    //any text-overflow elements should have a title with the whole string
    recordingEventSelectorNode.title = recordingEvent.recordingEventCssSelectorPath || recordingEvent.recordingEventCssDomPath;
    
    //<td data-field="recordingEventInputType">N/A</td>
    let recordingEventInputTypeNode = tempNode.querySelector('td[data-label="recordingEventInputType"]');
    recordingEventInputTypeNode.textContent = recordingEvent.recordingEventInputType;
    
    //<td data-field="recordingEventInputValue" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">N/A</td>
    let recordingEventInputValueNode = tempNode.querySelector('td[data-label="recordingEventInputValue"]');
    recordingEventInputValueNode.textContent = recordingEvent.recordingEventInputValue;
    //any text-overflow elements should have a title with the whole string
    recordingEventInputValueNode.title = recordingEvent.recordingEventInputValue;
    
    //<td data-field="recordingEventLocation" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">https://www.example.com</td>
    let recordingEventLocationNode = tempNode.querySelector('td[data-label="recordingEventLocation"]');
    recordingEventLocationNode.textContent = recordingEvent.recordingEventLocation;
    //any text-overflow elements should have a title with the whole string
    recordingEventLocationNode.title = recordingEvent.recordingEventLocation;
    
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

function updateNewRecordingEventsTable(recording) {

    //empty the table body first
    $('.ui.newRecordingRecordingEventsTable.table tbody').empty();
    //get a reference to the table
    const table = document.querySelector('.ui.newRecordingRecordingEventsTable.table tbody')
    //then for each recordingEvent we need to add it to the table and the textarea
    for (let recordingEvent in recording.recordingEventArray) { 
        //then use the function that is shared by recordings.js
        addNewRecordingEventToTable(recording, recording.recordingEventArray[recordingEvent], table);
    }
    //add recording events table button listeners
    addNewRecordingEventButtonListeners();

}

function addNewRecordingEventButtonListeners() {

    //show recording event button click handler
    $('.ui.newRecordingRecordingEventsTable .showRecordingEventRow').on('click', function(){
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
                $('.ui.viewNewRecordingEvent.form input[name=recordingEventCssSelectorPath]').val(recordingEvent.recordingEventCssSelectorPath);
                $('.ui.viewNewRecordingEvent.form input[name=recordingEventCssDomPath]').val(recordingEvent.recordingEventCssDomPath);
                $('.ui.viewNewRecordingEvent.form input[name=recordingEventCssFinderPath]').val(recordingEvent.recordingEventCssFinderPath);
                $('.ui.viewNewRecordingEvent.form input[name=recordingEventXPath]').val(recordingEvent.recordingEventXPath);
                $('.ui.viewNewRecordingEvent.form input[name=recordingEventLocation]').val(recordingEvent.recordingEventLocation);
                //then the checkbox
                recordingEvent.recordingEventIsIframe == true ? $('.ui.viewNewRecordingEvent .ui.checkbox input[name=recordingEventIsIframe]').prop('checked', true) : $('.ui.viewNewRecordingEvent .ui.checkbox input[name=recordingEventIsIframe]').prop('checked', false);
                //show the form and the structure div
                $('.viewNewDetailedTableEventsFooter').css("display", "table-row");
            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error)); 
            
    })

}

function addStartRecordingHandler() {

    //RECORDING EVENTS START HANDLER
    const recordingEventObservable = Rx.Observable.fromEvent(document.querySelector('.ui.startRecording.positive.button'), 'click')
        //make the changes to the ui to indicate that we have started
        .do(event => {
            //show the start recording button as disabled
            event.target.className += " disabled";
            //show the recording loader
            $('.ui.text.small.recording.loader').addClass('active');
            //then empty the table
            $('.ui.newRecordingRecordingEventsTable.table tbody').empty();
            //then report to Google analytics so we can see how often recordings happen 
            ga('send', { hitType: 'event', eventCategory: 'NewRecording', eventAction: `Click`, eventLabel: 'RecordingCreationData'});
        })
        //map the event to the recording that has started by querying storage using the data id from the button
        .flatMap(event => Rx.Observable.fromPromise(StorageUtils.getSingleObjectFromDatabaseTable('newRecording.js', event.target.getAttribute('data-recording-id') , 'recordings')))
        //we need to instruct background script to start the tab with the recording 
        .do(recording => new RecordReplayMessenger({}).sendMessage({newRecording: recording}))
        //then we create a recording messenger that updates its active recording each time there is a message emitted
        .switchMap( () =>
            //then we need to start receiving recording events sent here by the content script, originating in either main frame or iframe content scripts
            new RecordReplayMessenger({}).isAsync(false).chromeOnMessageObservable
                //we only want to receive recording events here
                .filter(msgObject => msgObject.request.hasOwnProperty('recordingEvent'))
                //then we need to send a response to the location that sent out the event
                .do(msgObject => msgObject.sendResponse({message: `User Interface Received Recording Event: ${msgObject.request.recordingEvent.recordingEventId}`}))
                //we only care about the recording events at the moment so we can just map to those
                .map(msgObject => msgObject.request.recordingEvent)
                //and we need to start with a dummy marker so we can operate with only one emission, this must come before pairwise() to create the first pair
                .startWith(new RecordingEvent({recordingEventOrigin: 'PairwiseStart'}))
                //then we need to get the time between each emission so we take two emissions at a time
                .pairwise()
                //this then delivers an array with the previous and the current, we only need the current, with adjusted recordingTimeSincePrevious
                .map(([previousRecording, currentRecording]) => {
                    //if the previous was not the dummy 'PairwiseStart', then we need to add the relative time of the recording event so we can exactly reproduce timing steps with delays
                    //if it is then the time will be 0, with zero delay, which is what we want
                    //this can be actioned in the replay mode via .concatMap(event => Rx.Observable.of(event).delay(event.recordingTimeSincePrevious))
                    previousRecording.recordingEventOrigin != 'PairwiseStart' ? currentRecording.recordingTimeSincePrevious = currentRecording.recordingEventCreated - previousRecording.recordingEventCreated : null;
                    //then we just need to return the current recording as we don't care about the dummy or the previous
                    return currentRecording;
                }),
            //then use the projection function to tie the two together
            (recording, recordingEvent) => {
                //push the new recording event into the recording's event array
                recording.recordingEventArray.push(recordingEvent);
                //then return the recording so it can be updated in the database
                return recording;
            }
        );
        
        //DELETION EVENTS
        const deletionEventObservable =  Rx.Observable.fromEvent(document, 'click')
            //we only care about elements that match our delete button class    
            .filter(event => event.target.classList.contains("deleteRecordingEventRow"))
            //then just to be sure we need them to have a data recording event id
            .filter(event => event.target.hasAttribute("data-recording-event-id"))
            //then we map all those clicks into their recording event ids
            .map(event => event.target.getAttribute("data-recording-event-id"))
            //then we need to start with a dummy string so we get an emission
            .startWith("DELETED RECORDING EVENT IDS FOLLOW")
            //then we scan them all into an array
            .scan((acc, value) => { acc.push(value); return acc; }, []);

        //THEN WE NEED TO COMBINE THE TWO SO WE GET THE EVENTS COMING FROM THE CURATED TAB AND OUR LIVE DELETION EVENTS
        Rx.Observable.combineLatest(
                //each of the recording events pumps out a new recording
                recordingEventObservable,
                //each of the deletion events pumps out a new set of deleted recording event ids
                deletionEventObservable,
                // combineLatest also takes an optional projection function
                (recording, deletedEventsIdArray) => {
                    //we need to save the recording's id as that will be lost on creation of the temporary class 
                    let carriedForwardId = recording.id
                    //then we create a temporary recording so we can use the class method to redo time since previous
                    let tempRecording = new Recording(recording);
                    //then we loop through all the elements of the array - it does not matter if they've been done before
                    for (let recordingEventId in deletedEventsIdArray) {
                        //then pick each of the deleted events from the recording's events array 
                        tempRecording.deleteRecordingEventById(deletedEventsIdArray[recordingEventId]);
                    }
                    //then add the recording id back
                    tempRecording.id = carriedForwardId
                    //then return the amended recording, if there have been any live deletions
                    return tempRecording;
                }
            )
            //we only want to make additions until the user interface stop recording button is clicked 
            .takeUntil(
                //merge the two sources of potential recording stop commands, either will do
                Rx.Observable.merge(
                    //obviously the stop button is a source of finalisation
                    Rx.Observable.fromEvent(document.querySelector('.ui.stopRecording.negative.button'), 'click')
                        //we need to send the message to the background script here 
                        .do(event => new RecordReplayMessenger({}).sendMessage({stopNewRecording: event.target.getAttribute('data-recording-id')})),
                    //less obviously, the user might choose to stop the recording by closing the tab window
                    //background scripts keep an eye on this and will send a message entitled recordingTabClosed
                    new RecordReplayMessenger({}).isAsync(false).chromeOnMessageObservable
                        //we only want to receive recordingTabClosed events here
                        .filter(msgObject => msgObject.request.hasOwnProperty('recordingTabClosed'))
                        //send the response so we don't get the silly errors
                        .do(msgObject => msgObject.sendResponse({message: `User Interface Received Tab Closed Event`}) )
                )
            )
            //change the user interface
            .subscribe(
                //when we get each mutated recording emitted, we need to update the recording in the database with its new recording event array
                recording => {
                    //log to the console so we can follow what's going on
                    console.log(recording);
                    //add the recording event to the table
                    updateNewRecordingEventsTable(recording);
                    //then add the button listeners
                    addNewRecordingEventButtonListeners();
                    //then update the recording in the database
                    StorageUtils.updateModelObjectInDatabaseTable('recordings.js', recording.id, recording, 'recordings');
                },
                error => console.error(error),
                //when complete we want to update the UI
                () => {  
                    //hide the recording loader
                    $('.ui.text.small.recording.loader').removeClass('active');
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
            
            //filter tests for default project by fetching from local storage
            const defaultProjectId = Number(localStorage.getItem("DefaultProject"));
            //if we have any number greater than zero, which indicates no default, then filter
            defaultProjectId > 0 ? testStorageArray = testStorageArray.filter(test => test.testProjectId == defaultProjectId) : null;

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

    $('.ui.newRecordingForm.form .ui.radio.device.checkbox').checkbox({
        onChecked: function() {
            //enable or disable the other inputs according to mobile or not
            if ($(this).attr('value') == "mobile") {
                $('.ui.newRecordingForm.form .orientation.field').removeClass('disabled');
                //send data to google analytics so we know how popular the mobile options are
                ga('send', { hitType: 'event', eventCategory: 'RecordingParams', eventAction: `${$(this).attr('value')}`, eventLabel: 'RecordingCreationData'});
            } else { 
                $('.ui.newRecordingForm.form .orientation.field').addClass('disabled');
                //send data to google analytics so we know how popular the mobile options are
                ga('send', { hitType: 'event', eventCategory: 'RecordingParams', eventAction: `${$(this).attr('value')}`, eventLabel: 'RecordingCreationData'}); 
            }
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
                            recordingTestVisualRegression: test.testVisualRegression,
                        });
                        console.log(newRecording);
                        //then we need to save to the database
                        StorageUtils.addModelObjectToDatabaseTable('newRecording.js', newRecording, 'recordings')
                            //which does not return anything but we don't need it as we fetch from database directly to update the projects table
                            .then(createdRecordingId => {
                                //remove the loading indicator from the button
                                $('.ui.newRecordingForm .ui.submit.button').removeClass('loading');
                                //clear the new recording recording events table of any previous entries
                                $('.ui.newRecordingRecordingEventsTable.table tbody').empty();
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