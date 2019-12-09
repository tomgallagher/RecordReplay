function addAssertableEventsToTable(recording, assertableArray) {

    //empty the recordings table body so we can add the updated information
    $('.ui.celled.newReplayAssertionsTable.table tbody').empty();
    //first we have to check that there are assertable elements that require the table and element structure to be shown
    if (assertableArray.length) {

        //target our table row template first, we only need to find the template once
        let targetNode = document.querySelector('.newReplayAssertionsTableRowTemplate');
        //we need to do more work as we have to save the template in a table, which we don't need, we just want the row
        let targetRow = targetNode.querySelector('tr');
        //then create a document fragment that we will use as a container for each looped template
        let docFrag = document.createDocumentFragment();
        //then if we have some assertable events we need to populate the table
        for (let assertable in assertableArray) {     
            
            //then we make a clone of the row, that will serve the purpose
            let tempNode = targetRow.cloneNode(true);
            //<td data-label="replay_recordingEventOrigin">User</td>
            let assertionOriginNode = tempNode.querySelector('td[data-label="replay_recordingEventOrigin"]');
            assertionOriginNode.textContent = assertableArray[assertable].recordingEventOrigin;
            //<td data-label="replay_recordingEventAction">Mouse</td>
            let assertionActionNode = tempNode.querySelector('td[data-label="replay_recordingEventAction"]');
            assertionActionNode.textContent = assertableArray[assertable].recordingEventAction;
            //<td data-label="replay_recordingEventActionType">Click</td>
            let assertionActionTypeNode = tempNode.querySelector('td[data-label="replay_recordingEventActionType"]');
            assertionActionTypeNode.textContent = assertableArray[assertable].recordingEventActionType;
            //<td data-label="replay_recordingEventHTMLTag">BUTTON</td>
            let assertionHTMLTagNode = tempNode.querySelector('td[data-label="replay_recordingEventHTMLTag"]');
            assertionHTMLTagNode.textContent = assertableArray[assertable].recordingEventHTMLTag;
            //<td data-label="replay_recordingEventCssSelectorPath" style="max-width: 1500px; overflow: hidden; text-overflow: ellipsis;">div > a</td>
            let assertionCssSelectorNode = tempNode.querySelector('td[data-label="replay_recordingEventCssSelectorPath"]');
            assertionCssSelectorNode.textContent = assertableArray[assertable].recordingEventCssSelectorPath;
            //<td data-label="replay_recordingEventLocation" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">https://www.example.com</td>
            let assertionLocationNode = tempNode.querySelector('td[data-label="replay_recordingEventLocation"]');
            assertionLocationNode.textContent = assertableArray[assertable].recordingEventLocation;
            //then the buttons
            let assertionAssertLink = tempNode.querySelector('.assertEventLink');
            assertionAssertLink.setAttribute('data-recording-event-id', `${assertableArray[assertable].recordingEventId}`);
            assertionAssertLink.setAttribute('data-recording-id', `${recording.id}`);
            let assertionDeleteLink = tempNode.querySelector('.deleteEventLink');
            assertionDeleteLink.setAttribute('data-recording-event-id', `${assertableArray[assertable].recordingEventId}`);
            assertionDeleteLink.setAttribute('data-recording-id', `${recording.id}`);
             //then we need to attach the clone of the template node to our container fragment
            docFrag.appendChild(tempNode);

        }
        //then after the entire loop has been executed we need to adjust the dom in one hit, avoid performance issues with redraw
        //then we find the relevant table, using docuement.querySelector which helpfully returns the first Element within the document that matches the specified selector
        let assertionsTable = document.querySelector('.ui.celled.newReplayAssertionsTable.table tbody');
        //then we append the fragment to the table
        assertionsTable.appendChild(docFrag);
        //show the assertions field
        $('.optionalAssertions').css('display', 'block');
        //and add the button listeners
        addAssertOrDeleteButtonListeners();
    } else {
         //hide the assertions field
         $('.optionalAssertions').css('display', 'none');
    }
    

}

function addAssertOrDeleteButtonListeners() {

    //the assert function needs to open the assertion UI first, then add a processor for assertion checking
    $('.ui.newReplayAssertionsTable .assertEventLink').on('mousedown', function(){
        //first we need to get the recording key
        const recordingKey = $(this).attr("data-recording-id");
        //do the same with the recording event key
        const recordingEventKey = $(this).attr("data-recording-event-id");
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('recordings.js', recordingKey, 'recordings')
            //then we have a returned js object with the recording details
            .then(recording => {
                //get a new instantiation of our recording, so we can use the search method
                var searchableRecording = new Recording(recording);
                //use the method to get the recording event
                const recordingEvent = searchableRecording.findRecordingEventById(recordingEventKey);
                //determine the json object holder according to type of recording event
                let jsonObject;
                switch(true) {
                    case recordingEvent.recordingEventAction == 'Mouse' && recordingEvent.recordingEventActionType == 'hover':
                        jsonObject = recordingEvent.recordingEventHoverTargetAsJSON;
                        break;
                    case recordingEvent.recordingEventAction == 'TextSelect' && recordingEvent.recordingEventActionType == 'selectstart':
                        jsonObject = recordingEvent.recordingEventTextSelectTargetAsJSON;
                        break;
                    default:
                        console.error("Unassertable Event in Assertion Event Table");
                        return;
                }
                //on each call we empty the list container we are using to create a dom structure
                $('.replayEventTargetStructureList').empty();
                //then we deliver the pre-cooked html fragment from the Node builder, which loops through the DOM structure to create a tree
                //we can use the same builder for recordings and replays just by adding the isReplay marker as false, which shows no assertion checkboxes
                $('.replayEventTargetStructureList').append(new NodeBuilder({isReplay: true, eventId: recordingEventKey}).build(jsonObject));
                //then we need to activate all the checkboxes
                $('.ui.replayEventTargetStructureList .ui.assertion.checkbox').checkbox();
                //then once it has been built, and added, then we are ready to show the display
                $('.replayEventTargetStructureDisplay').show();
                //then we add the listener for checkbox clicks, passing in the recording
                addAssertionCheckboxListener(recording);

            });

    });

    //the delete function is essentially the same as in the recordings.js routine
    //we are just deleting an item from the recording
    $('.ui.newReplayAssertionsTable .deleteEventLink').on('mousedown', function(){
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
                //then get the new assertable array for presentation
                const assertableArray = editedRecording.recordingEventArray.filter(item => item.recordingEventActionType == "hover" || item.recordingEventActionType == "selectstart");
                //then update the events table so we can see the changes
                addAssertableEventsToTable(editedRecording, assertableArray);
                //then return the edited recording, with new set of events, for saving in the database
                return editedRecording;
            })
            //then we need to save the edited recording
            .then(editedRecording => StorageUtils.updateModelObjectInDatabaseTable('recordings.js', editedRecording.id, editedRecording, 'recordings'))
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));   

    });


}

function addAssertionCheckboxListener(recording) {

    //first we need to create a searchable recording
    const searchableRecording = new Recording(recording);

    //then we need a process that deals with the checking of checkboxes
    Rx.Observable.fromEvent(document.querySelectorAll('.ui.replayEventTargetStructureList .ui.assertion.checkbox'), 'change')
        //then we filter for the event target being checked
        .filter(event => event.target.checked)
        //then we stop subscribing to these events when the end processing observable emits
        .takeUntil(Rx.Observable.fromEvent(document.querySelector('.ui.newReplayForm .ui.submit.button'), 'mousedown'))
        //then we need to map to the event target, we are particularly interested in the data properties of the event target, added by nodebuilder class
        //these properties are available from the dataset object and are:
        //{ assertionAttribute: <str>, assertionType: <str>, assertionAttributeValue: <str>, assertionElementNestedLevel: <int_str>, assertionElementParent: <tag_str>, assertionRecordingEventId: <str> }
        .map(event => new Assertion(
            //add the recording event to the assertion as it is an extension of the recording event model
            searchableRecording.findRecordingEventById(event.target.dataset.assertionRecordingEventId),
            {
                assertionType: event.target.dataset.assertionType,
                assertionAttribute: event.target.dataset.assertionAttribute,
                assertionValue: event.target.dataset.assertionAttributeValue,
                assertionElement: event.target.dataset.assertionElementParent,
                assertionNestedLevel: event.target.dataset.assertionElementNestedLevel
            }
        ))
        //then we need to update the hidden input array with our new assertion
        .do(assertion => {
            //get the current value of the assertions we have collected, parsed from the string version
            const hiddenAssertionsCollectionArray = JSON.parse($('.ui.newReplayForm.form input[name="hiddenAssertionsCollector"]').val());
            //push the new assertion into the collection
            hiddenAssertionsCollectionArray.push(assertion);
            //then put in the new value
            $('.ui.newReplayForm.form input[name="hiddenAssertionsCollector"]').val(JSON.stringify(hiddenAssertionsCollectionArray));
        })
        //then we report
        .subscribe(
            x => console.log(x),
            error => console.error(error),
            () => console.log("IsChecked Processor Complete")
        );

    //and a process that deals with the unchecking of checkboxes
    Rx.Observable.fromEvent(document.querySelectorAll('.ui.replayEventTargetStructureList .ui.assertion.checkbox'), 'change')
        //then we filter for the event target being unchecked
        .filter(event => !event.target.checked)
        //then we stop subscribing to these events when the end processing observable emits
        .takeUntil(Rx.Observable.fromEvent(document.querySelector('.ui.newReplayForm .ui.submit.button'), 'mousedown'))
        //then we want to adjust the hidden assertion collection array, to remove the item that has been checked
        .do(event => {
            //get the current value of the assertions we have collected, parsed from the string version
            const hiddenAssertionsCollectionArray = JSON.parse($('.ui.newReplayForm.form input[name="hiddenAssertionsCollector"]').val());
            //set up the params we are looking to filter on
            const assertionRecordingEventId = event.target.dataset.assertionRecordingEventId;
            const assertionType = event.target.dataset.assertionType;
            const assertionAttribute = event.target.dataset.assertionAttribute;
            const assertionValue = event.target.dataset.assertionAttributeValue;
            //filter the array for any items that contain our params
            const filteredHiddenAssertionsCollectionArray = hiddenAssertionsCollectionArray
                //first we allow entry into new array by the recording event id, so we don't get any weird crossover bugs
                .filter(item => item.recordingEventId != assertionRecordingEventId)
                //then we allow entry into the new array as long as the any of assertion type, attribute and value don't match 
                .filter(item => item.assertionType != assertionType || item.assertionAttribute != assertionAttribute || item.assertionValue != assertionValue  )
            //then we just paste in the new value of the array
            $('.ui.newReplayForm.form input[name="hiddenAssertionsCollector"]').val(JSON.stringify(filteredHiddenAssertionsCollectionArray));
        })
        //then we report
        .subscribe(
            event => console.log(`Deleted Assertion on Recording Event ${event.target.dataset.assertionRecordingEventId}`),
            error => console.error(error),
            () => console.log("IsNotChecked Processor Complete")
        );

}

//THIS FUNCTION IS SHARED BY REPLAYS.JS
//CHECK BOTH FILES BEFORE MAKING CHANGES
function addNewReplayEventToTable(replay, replayEvent, table) {

    //target our table row template first, we only need to find the template once
    let targetNode = document.querySelector('.replayEventTableRowTemplate');
    //we need to do more work as we have to save the template in a table, which we don't need, we just want the row
    let targetRow = targetNode.querySelector('tr');
    //then create a document fragment that we will use as a container for each looped template
    let docFrag = document.createDocumentFragment();
    //then we make a clone of the row, that will serve the purpose
    let tempNode = targetRow.cloneNode(true);

    //if the event has taken place in an iframe we add the warning class
    if (replayEvent.recordingEventIsIframe) { tempNode.classList.add('warning');}
    //if the event has been passed in from the web navigator then we show it as disabled
    if (replayEvent.recordingEventAction == "Page") { tempNode.classList.add('disabled');}
    //if the event is an assertion event then we need to add the active class
    if (replayEvent.assertionId) { tempNode.classList.add('assertionTableRow'); }

    //then we need to have a reference to the replay event on the table row itself, so we can alter it
    //need to handle replays and assertions
    tempNode.setAttribute("data-replay-event-id", replayEvent.assertionId || replayEvent.replayEventId);

    //<td data-label="replay_recordingEventOrigin">User</td>
    let replayEventOriginNode = tempNode.querySelector('td[data-label="replay_recordingEventOrigin"]');
    //then we need to handle both replays and assertions
    replayEventOriginNode.textContent = replayEvent.assertionEventOrigin || replayEvent.recordingEventOrigin;
                            
    //<td data-label="replay_recordingEventAction">Mouse</td>
    let replayEventActionNode = tempNode.querySelector('td[data-label="replay_recordingEventAction"]');
    //then we need to handle both replays and assertions
    replayEventActionNode.textContent = replayEvent.assertionEventAction || replayEvent.recordingEventAction;
                            
    //<td data-label="replay_recordingEventActionType">Click</td>
    let replayEventTypeNode = tempNode.querySelector('td[data-label="replay_recordingEventActionType"]');
    //then we need to handle both replays and assertions
    replayEventTypeNode.textContent = replayEvent.assertionType || replayEvent.recordingEventActionType;
                            
    //<td data-label="replay_recordingEventHTMLTag">BUTTON</td>
    let replayEventTagNode = tempNode.querySelector('td[data-label="replay_recordingEventHTMLTag"]');
    //same for both
    replayEventTagNode.textContent = replayEvent.recordingEventHTMLTag;

    //<td data-label="replay_recordingEventCssSelectorPath" style="max-width: 1500px; overflow: hidden; text-overflow: ellipsis;">div > a</td>
    let replayEventCssSelectorNode = tempNode.querySelector('td[data-label="replay_recordingEventCssSelectorPath"]');
    //same for both
    replayEventCssSelectorNode.textContent = replayEvent.recordingEventCssSelectorPath;
    
    //<td data-label="replay_recordingEventInputType">N/A</td>
    let replayEventInputNode = tempNode.querySelector('td[data-label="replay_recordingEventInputType"]');
    //then we need to handle both replays and assertions
    replayEventInputNode.textContent = replayEvent.assertionAttribute || replayEvent.recordingEventInputType;

    //<td data-label="replay_recordingEventInputValue" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">N/A</td>
    let replayEventInputValueNode = tempNode.querySelector('td[data-label="replay_recordingEventInputValue"]');
    //then we need to handle both replays and assertions
    replayEventInputValueNode.textContent = replayEvent.assertionValue || replayEvent.recordingEventInputValue;
                            
    //<td data-label="replay_recordingEventLocation" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">https://www.example.com</td>
    let replayEventLocationNode = tempNode.querySelector('td[data-label="replay_recordingEventLocation"]');
    //same for both
    replayEventLocationNode.textContent = replayEvent.recordingEventLocation;

    //<td data-label="replay_timestamp_created">Some time</td>
    let replayEventTimeCreatedNode = tempNode.querySelector('td[data-label="replay_timestamp_created"]');
    //same for both
    replayEventTimeCreatedNode.textContent = replayEvent.recordingTimeSincePrevious == 0 ? new Date(replayEvent.recordingEventCreated).toLocaleString() : `+ ${Math.ceil(replayEvent.recordingTimeSincePrevious / 1000)} sec`

    //<td data-label="replay_timestamp_executed"></td>
    //then we only need to add an executed timestamp if we actually have an execution
    if (replayEvent.assertionEventStatus && replayEvent.assertionEventStatus !== null) {  
        let replayEventTimeExecutedNode = tempNode.querySelector('td[data-label="replay_timestamp_executed"]');
        //then we need to handle both replays and assertions
        replayEventTimeExecutedNode.textContent = replayEvent.assertionEventReplayed;
    }

    if (replayEvent.replayEventStatus && replayEvent.replayEventStatus !== null) {  
        let replayEventTimeExecutedNode = tempNode.querySelector('td[data-label="replay_timestamp_executed"]');
        //then we need to handle both replays and assertions
        replayEventTimeExecutedNode.textContent = replayEvent.replayEventReplayed;
    }

    //then the buttons need the replay event id
    let replayEventShowLink = tempNode.querySelector('.showReplayEventRow');
    //then we need to handle both replays and assertions
    replayEventShowLink.setAttribute('data-replay-event-id', `${replayEvent.assertionId || replayEvent.replayEventId}`);
    //same for both
    replayEventShowLink.setAttribute('data-replay-id', `${replay.id}`);

    let replayEventDeleteLink = tempNode.querySelector('.deleteReplayEventRow');
    //then we need to handle both replays and assertions
    replayEventDeleteLink.setAttribute('data-replay-event-id', `${replayEvent.assertionId || replayEvent.replayEventId}`);
    //same for both
    replayEventDeleteLink.setAttribute('data-replay-id', `${replay.id}`);

    //then we need to attach the clone of the template node to our container fragment
    docFrag.appendChild(tempNode);
    //then we append the fragment to the table
    table.appendChild(docFrag);   


}

function updateNewReplayEventsTable(newReplay) {

    //empty the table body first
    $('.ui.newReplayReplayEventsTable.table tbody').empty();
    //get a reference to the table
    const table = document.querySelector('.ui.newReplayReplayEventsTable.table tbody')
    //then for each recordingEvent we need to add it to the table and the textarea
    for (let replayEvent in newReplay.replayEventArray) { 
        //then use the function that is shared by replays.js
        addNewReplayEventToTable(newReplay, newReplay.replayEventArray[replayEvent], table);
    }

}

function refreshNewReplayRecordingDropdown() {

    //get the tests data from the database so we can have recordings linked to tests
    StorageUtils.getAllObjectsInDatabaseTable('newReplay.js', 'recordings')
        //once we have the array then we can start populating the new test form projects dropdwon by looping through the array
        .then(recordingStorageArray => {
            
            //get a reference to the drop down in the new recording form
            var newReplayDropDownMenu = $('.ui.fluid.selection.newReplay.recording.dropdown .menu');
            //empty the dropdown of existing items
            newReplayDropDownMenu.empty();
            //use for-in loop as execution order is maintained to insert all the tests, with references, in the dropdown
            for (let recording in recordingStorageArray) {     
                //we are not going to use templates here as we are not dealing with complex html structures
                newReplayDropDownMenu.append(`<div class="item" data-value=${recordingStorageArray[recording].id}>${recordingStorageArray[recording].recordingName}</div>`);
            }
            //then after the entire loop has been executed we need to initialise the dropdown with the updated items
            $('.ui.fluid.selection.newReplay.recording.dropdown').dropdown({
                onChange: function(value) {
                    //data value always returns a string and we need the id in number form
                    const recordingId = Number(value);
                    //then we need to get the right item from the array so we can populate the test start url field in the visible form
                    const recording = recordingStorageArray.find(item => item.id == recordingId);
                    //then we need a data appended to the recording name for the unique replay name
                    const date = new Date(Date.now());
                    const dateString = date.toLocaleString();
                    //populate the visible form but leave it disabled - it's readable but the form does not mutate and require reseting
                    $('.ui.newReplayForm.form input[name=replayName]').val(`${recording.recordingName} #${dateString}`);
                    $('.ui.newReplayForm.form input[name=replayRecordingStartUrl]').val(recording.recordingTestStartUrl);
                    //then we want to reset the hidden assertions collector
                    $('.ui.newReplayForm.form input[name="hiddenAssertionsCollector"]').val("[]");
                    //create an array from the recording recording events array with any hover and text select recording events - the only assertable events
                    const assertableArray = recording.recordingEventArray.filter(item => item.recordingEventActionType == "hover" || item.recordingEventActionType == "selectstart");
                    //then populate the table with events, if any
                    addAssertableEventsToTable(recording, assertableArray);

                }

            });

        });  

}

$(document).ready (function(){

    $('.ui.newReplayForm.form')
        .form({
            on: 'blur',
            fields: {
                replayRecordingId: {
                    identifier: 'replayRecordingId',
                    rules: [
                        { type : 'empty', prompt : 'Please select a recording for replay' }
                    ]
                },
                replayName: {
                    identifier : 'replayName',
                    rules: [
                        { type : 'empty', prompt : 'Please enter replay name by selecting a recording' }
                    ]
                },
                replayRecordingStartUrl: {
                    identifier : 'replayRecordingStartUrl',
                    rules: [
                        { type : 'empty', prompt : 'Please enter start url by selecting a recording' }
                    ]
                },
            },
            onSuccess(event, fields) {
                //always need to have this with a submit button otherwise the entire page reloads
                event.preventDefault();
                //we're always interested in fields
                console.log(fields);
                //first we want to hide the assertions input section
                $('.replayEventTargetStructureDisplay').hide();
                //then we want to hide the assertions table
                $('.optionalAssertions').css('display', 'none');
                //add the loading indicator to the button, to indicate saving of the replay to the database
                $('.ui.newReplayForm .ui.submit.button').addClass('loading');
                //clear the new replay replay events table of any previous entries
                $('.ui.newReplayReplayEventsTable.table tbody').empty();
                //then we can start to create our new replay, starting with the fetching of the recording from the database
                const recordingKey = fields.replayRecordingId;
                //the recording key will be in string format - StorageUtils handles conversion
                StorageUtils.getSingleObjectFromDatabaseTable('recordings.js', recordingKey, 'recordings')
                    //then we have a returned js object with the recording details
                    .then(recording => {
                        //then we need to make sure the replay's recording id is in a number format, so we can search and delete
                        fields.replayRecordingId = StorageUtils.standardiseKey(fields.replayRecordingId);
                        //then we need to create our new replay, which is an extension of recording and has its own fields as well
                        //we can just push the fields in the constructor, any non-defaults just get ignored
                        const newReplay = new Replay(recording, fields);
                        //then we need to add all the replay events by extending the recording events, with the ability to customise in options object
                        newReplay.replayEventArray = recording.recordingEventArray.map(recordingEvent => new ReplayEvent(recordingEvent, {}));
                        //then we need to get hold of the assertions array
                        const assertionsArray = JSON.parse(fields.hiddenAssertionsCollector);
                        //then we add the assertions array in
                        newReplay.replayEventArray = newReplay.replayEventArray.concat(assertionsArray);
                        //then we need to create a sorted array, which generates mixed replay events and assertion events in the correct order
                        //we also need the time since previous to be adjusted in cases where assertions share the same timestamp as the hover or text select event
                        newReplay.sortReplayEventsByTime();
                        //storage does not save replays with the class methods attached
                        //it is not clear why, as the recordings are saved OK with class methods attached
                        //probably something to do with extending the recording class with replay
                        delete newReplay.printExecutionTime;
                        delete newReplay.printStatus;
                        delete newReplay.sortReplayEventsByTime;
                        //then we just need to return the replay for saving in the database
                        return newReplay;
                    })
                    //then we need to save the new replay to the database
                    .then(newReplay => StorageUtils.addModelObjectToDatabaseTable('newReplay.js', newReplay, 'replays') )
                    //then we need to get all the replay UI ready to start replay, for which we need the replay with the id
                    .then(createdReplayId => StorageUtils.getSingleObjectFromDatabaseTable('newReplay.js', createdReplayId, 'replays') )
                    //then we need to do the updates
                    .then(savedReplay => {
                        //SHOW THE USER INTERFACE UPDATES
                        //remove the loading indicator from the button
                        $('.ui.newReplayForm .ui.submit.button').removeClass('loading');
                        //then we need to populate the replay table with the sorted events, so it can then indicate progress, success and failure
                        //this uses a generic function that will be shares by replays.js, and takes a reference to the replay and the table 
                        updateNewReplayEventsTable(savedReplay);
                        //we need to show the replay events segment after we have populated the table
                        $('.ui.replayEvents.segment').css('display', 'block');
                        //then run the function that enables the vertical menu buttons
                        enableVerticalMenuButtonsWhenDataAllows();
                    
                        //GETTING READY FOR SECOND TIME AROUND
                        //undisable the button if we have had a previous new replay
                        $('.ui.startReplay.positive.button').removeClass('disabled');
                        //change the data-replay-id of the start and stop buttons, so we can retrieve the replay on replay start
                        $('.ui.startReplay.positive.button, .ui.stopReplay.negative.button').attr("data-replay-id", savedReplay.id);
                        //then we want to reset the hidden assertions collector
                        $('.ui.newReplayForm.form input[name="hiddenAssertionsCollector"]').val("[]");

                    })
                    //the get single object function will reject if object is not in database
                    .catch(error => console.error(error));                 

            }

        });

});