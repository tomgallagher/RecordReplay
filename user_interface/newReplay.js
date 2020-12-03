function addAssertableEventsToTable(recording, assertableArray) {
    //empty the replay assertions table body so we can add the updated information
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
            let assertionCssSelectorNode = tempNode.querySelector(
                'td[data-label="replay_recordingEventCssSelectorPath"]'
            );
            assertionCssSelectorNode.textContent = assertableArray[assertable].recordingEventCssSelectorPath;
            //any text-overflow elements should have a title with the whole string
            assertionCssSelectorNode.title = assertableArray[assertable].recordingEventCssSelectorPath;

            //<td data-label="replay_recordingEventLocation" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">https://www.example.com</td>
            let assertionLocationNode = tempNode.querySelector('td[data-label="replay_recordingEventLocation"]');
            assertionLocationNode.textContent = assertableArray[assertable].recordingEventLocation;
            //any text-overflow elements should have a title with the whole string
            assertionLocationNode.title = assertableArray[assertable].recordingEventLocation;

            //then the buttons
            let assertionAssertLink = tempNode.querySelector('.assertEventLink');
            assertionAssertLink.setAttribute(
                'data-recording-event-id',
                `${assertableArray[assertable].recordingEventId}`
            );
            assertionAssertLink.setAttribute('data-recording-id', `${recording.id}`);
            let assertionDeleteLink = tempNode.querySelector('.deleteEventLink');
            assertionDeleteLink.setAttribute(
                'data-recording-event-id',
                `${assertableArray[assertable].recordingEventId}`
            );
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
    $('.ui.newReplayAssertionsTable .assertEventLink').on('click', function () {
        //first we need to get the recording key
        const recordingKey = $(this).attr('data-recording-id');
        //do the same with the recording event key
        const recordingEventKey = $(this).attr('data-recording-event-id');
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('recordings.js', recordingKey, 'recordings')
            //then we have a returned js object with the recording details
            .then((recording) => {
                //get a new instantiation of our recording, so we can use the search method
                var searchableRecording = new Recording(recording);
                //use the method to get the recording event
                const recordingEvent = searchableRecording.findRecordingEventById(recordingEventKey);
                //determine the json object holder according to type of recording event
                let jsonObject;
                switch (true) {
                    case recordingEvent.recordingEventAction == 'Mouse' &&
                        recordingEvent.recordingEventActionType == 'hover':
                        jsonObject = recordingEvent.recordingEventHoverTargetAsJSON;
                        break;
                    case recordingEvent.recordingEventAction == 'TextSelect' &&
                        recordingEvent.recordingEventActionType == 'selectstart':
                        jsonObject = recordingEvent.recordingEventTextSelectTargetAsJSON;
                        break;
                    default:
                        console.error('Unassertable Event in Assertion Event Table');
                        return;
                }
                //on each call we empty the list container we are using to create a dom structure
                $('.replayEventTargetStructureList').empty();
                //then we deliver the pre-cooked html fragment from the Node builder, which loops through the DOM structure to create a tree
                //we can use the same builder for recordings and replays just by adding the isReplay marker as false, which shows no assertion checkboxes
                $('.replayEventTargetStructureList').append(
                    new NodeBuilder({ isReplay: true, eventId: recordingEventKey }).build(jsonObject)
                );
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
    $('.ui.newReplayAssertionsTable .deleteEventLink').on('click', function () {
        //find the recording in the database by id, using data-recording-id from the template
        const recordingKey = $(this).attr('data-recording-id');
        //do the same with the recording event key
        const recordingEventKey = $(this).attr('data-recording-event-id');
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('recordings.js', recordingKey, 'recordings')
            //then we have a returned js object with the recording details
            .then((recording) => {
                //get a new instantiation of our recording, which will lose the id
                var editedRecording = new Recording(recording);
                //add the id back so we can save using the id
                editedRecording.id = recording.id;
                //remove the deleted item and order according to time stamp, using the method attached to the recording model
                editedRecording.deleteRecordingEventById(recordingEventKey);
                //then get the new assertable array for presentation
                const assertableArray = editedRecording.recordingEventArray.filter(
                    (item) => item.recordingEventActionType == 'hover' || item.recordingEventActionType == 'selectstart'
                );
                //then update the events table so we can see the changes
                addAssertableEventsToTable(editedRecording, assertableArray);
                //then return the edited recording, with new set of events, for saving in the database
                return editedRecording;
            })
            //then we need to save the edited recording
            .then((editedRecording) =>
                StorageUtils.updateModelObjectInDatabaseTable(
                    'recordings.js',
                    editedRecording.id,
                    editedRecording,
                    'recordings'
                )
            )
            //the get single object function will reject if object is not in database
            .catch((error) => console.error(error));
    });
}

function addAssertionCheckboxListener(recording) {
    //first we need to create a searchable recording
    const searchableRecording = new Recording(recording);

    //then we need a process that deals with the checking of checkboxes
    Rx.Observable.fromEvent(
        document.querySelectorAll('.ui.replayEventTargetStructureList .ui.assertion.checkbox'),
        'change'
    )
        //then we filter for the event target being checked
        .filter((event) => event.target.checked)
        //then we stop subscribing to these events when the end processing observable emits
        .takeUntil(Rx.Observable.fromEvent(document.querySelector('.ui.newReplayForm .ui.submit.button'), 'click'))
        //then we need to map to the event target, we are particularly interested in the data properties of the event target, added by nodebuilder class
        //these properties are available from the dataset object and are:
        //{ assertionAttribute: <str>, assertionType: <str>, assertionAttributeValue: <str>, assertionElementNestedLevel: <int_str>, assertionElementParent: <tag_str>, assertionRecordingEventId: <str> }
        .map(
            (event) =>
                new Assertion(
                    //add the recording event to the assertion as it is an extension of the recording event model
                    searchableRecording.findRecordingEventById(event.target.dataset.assertionRecordingEventId),
                    {
                        assertionType: event.target.dataset.assertionType,
                        assertionAttribute: event.target.dataset.assertionAttribute,
                        assertionValue: event.target.dataset.assertionAttributeValue,
                        assertionElement: event.target.dataset.assertionElementParent,
                        assertionNestedLevel: event.target.dataset.assertionElementNestedLevel,
                    }
                )
        )
        //then we need to update the hidden input array with our new assertion
        .do((assertion) => {
            //get the current value of the assertions we have collected, parsed from the string version
            const hiddenAssertionsCollectionArray = JSON.parse(
                $('.ui.newReplayForm.form input[name="hiddenAssertionsCollector"]').val()
            );
            //push the new assertion into the collection
            hiddenAssertionsCollectionArray.push(assertion);
            //then put in the new value
            $('.ui.newReplayForm.form input[name="hiddenAssertionsCollector"]').val(
                JSON.stringify(hiddenAssertionsCollectionArray)
            );
            //then report to Google analytics so we can see how often assertions happen
            ga('send', {
                hitType: 'event',
                eventCategory: 'ReplayAddAssertion',
                eventAction: `Click`,
                eventLabel: 'ReplayCreationData',
            });
        })
        //then we report
        .subscribe(
            (x) => console.log(x),
            (error) => console.error(error),
            () => console.log('IsChecked Processor Complete')
        );

    //and a process that deals with the unchecking of checkboxes
    Rx.Observable.fromEvent(
        document.querySelectorAll('.ui.replayEventTargetStructureList .ui.assertion.checkbox'),
        'change'
    )
        //then we filter for the event target being unchecked
        .filter((event) => !event.target.checked)
        //then we stop subscribing to these events when the end processing observable emits
        .takeUntil(Rx.Observable.fromEvent(document.querySelector('.ui.newReplayForm .ui.submit.button'), 'click'))
        //then we want to adjust the hidden assertion collection array, to remove the item that has been checked
        .do((event) => {
            //get the current value of the assertions we have collected, parsed from the string version
            const hiddenAssertionsCollectionArray = JSON.parse(
                $('.ui.newReplayForm.form input[name="hiddenAssertionsCollector"]').val()
            );
            //set up the params we are looking to filter on
            const assertionRecordingEventId = event.target.dataset.assertionRecordingEventId;
            const assertionType = event.target.dataset.assertionType;
            const assertionAttribute = event.target.dataset.assertionAttribute;
            const assertionValue = event.target.dataset.assertionAttributeValue;
            //filter the array for any items that contain our params
            const filteredHiddenAssertionsCollectionArray = hiddenAssertionsCollectionArray
                //first we allow entry into new array by the recording event id, so we don't get any weird crossover bugs
                .filter((item) => item.recordingEventId != assertionRecordingEventId)
                //then we allow entry into the new array as long as the any of assertion type, attribute and value don't match
                .filter(
                    (item) =>
                        item.assertionType != assertionType ||
                        item.assertionAttribute != assertionAttribute ||
                        item.assertionValue != assertionValue
                );
            //then we just paste in the new value of the array
            $('.ui.newReplayForm.form input[name="hiddenAssertionsCollector"]').val(
                JSON.stringify(filteredHiddenAssertionsCollectionArray)
            );
        })
        //then we report
        .subscribe(
            (event) =>
                console.log(`Deleted Assertion on Recording Event ${event.target.dataset.assertionRecordingEventId}`),
            (error) => console.error(error),
            () => console.log('IsNotChecked Processor Complete')
        );
}

//THIS FUNCTION IS SHARED BY REPLAYS.JS AND BULKREPLAYS.JS
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
    if (replayEvent.recordingEventIsIframe) {
        tempNode.classList.add('warning');
    }
    //if the event has been passed in from the web navigator then we show it as disabled
    if (replayEvent.recordingEventAction == 'Page') {
        tempNode.classList.add('disabled');
    }
    //if the event is an assertion event then we need to add the active class
    if (replayEvent.assertionId) {
        tempNode.classList.add('assertionTableRow');
    }

    //then we need to have a reference to the replay event on the table row itself, so we can alter it
    //need to handle replays and assertions
    tempNode.setAttribute('data-replay-event-id', replayEvent.assertionId || replayEvent.replayEventId);

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
    //any text-overflow elements should have a title with the whole string
    replayEventCssSelectorNode.title = replayEvent.recordingEventCssSelectorPath;

    //<td data-label="replay_recordingEventInputType">N/A</td>
    let replayEventInputNode = tempNode.querySelector('td[data-label="replay_recordingEventInputType"]');
    //then we need to handle both replays and assertions
    replayEventInputNode.textContent = replayEvent.assertionAttribute || replayEvent.recordingEventInputType;

    //<td data-label="replay_recordingEventInputValue" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">N/A</td>
    let replayEventInputValueNode = tempNode.querySelector('td[data-label="replay_recordingEventInputValue"]');
    //then we need to handle both replays and assertions
    replayEventInputValueNode.textContent =
        replayEvent.recordingEventActionType == 'selectstart'
            ? replayEvent.recordingEventTextSelectTextContent
            : replayEvent.assertionValue || replayEvent.recordingEventInputValue;
    //any text-overflow elements should have a title with the whole string
    replayEventInputValueNode.title =
        replayEvent.recordingEventActionType == 'selectstart'
            ? replayEvent.recordingEventTextSelectTextContent
            : replayEvent.assertionValue || replayEvent.recordingEventInputValue;

    //<td data-label="replay_recordingEventLocation" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">https://www.example.com</td>
    let replayEventLocationNode = tempNode.querySelector('td[data-label="replay_recordingEventLocation"]');
    //same for both
    replayEventLocationNode.textContent = replayEvent.recordingEventLocationHref;
    //any text-overflow elements should have a title with the whole string
    replayEventLocationNode.title = replayEvent.recordingEventLocationHref;

    //<td data-label="replay_timestamp_created">Some time</td>
    let replayEventTimeCreatedNode = tempNode.querySelector('td[data-label="replay_timestamp_created"]');
    //same for both
    replayEventTimeCreatedNode.textContent =
        replayEvent.recordingTimeSincePrevious == 0
            ? new Date(replayEvent.recordingEventCreated).toLocaleString()
            : `+ ${Math.ceil(replayEvent.recordingTimeSincePrevious / 1000)} sec`;

    //<td data-label="replay_timestamp_executed"></td>
    //then we only need to add an executed timestamp if we actually have an execution
    if (replayEvent.assertionEventStatus && replayEvent.assertionEventStatus !== null) {
        let replayEventTimeExecutedNode = tempNode.querySelector('td[data-label="replay_timestamp_executed"]');
        //then we need to handle both replays and assertions
        replayEventTimeExecutedNode.textContent =
            replayEvent.assertionTimeSincePrevious == 0
                ? new Date(replayEvent.assertionEventReplayed).toLocaleString()
                : `+ ${Math.ceil(replayEvent.assertionTimeSincePrevious / 1000)} sec`;
    }

    if (replayEvent.replayEventStatus && replayEvent.replayEventStatus !== null) {
        let replayEventTimeExecutedNode = tempNode.querySelector('td[data-label="replay_timestamp_executed"]');
        //then we need to handle both replays and assertions
        replayEventTimeExecutedNode.textContent =
            replayEvent.replayTimeSincePrevious == 0
                ? new Date(replayEvent.replayEventReplayed).toLocaleString()
                : `+ ${Math.ceil(replayEvent.replayTimeSincePrevious / 1000)} sec`;
    }

    //then the buttons need the replay event id
    let replayEventShowLink = tempNode.querySelector('.showReplayEventRow');
    //then we need to handle both replays and assertions
    replayEventShowLink.setAttribute('data-replay-event-id', `${replayEvent.assertionId || replayEvent.replayEventId}`);
    //same for both
    replayEventShowLink.setAttribute('data-replay-id', `${replay.id}`);

    let replayEventDeleteLink = tempNode.querySelector('.deleteReplayEventRow');
    //then we need to handle both replays and assertions
    replayEventDeleteLink.setAttribute(
        'data-replay-event-id',
        `${replayEvent.assertionId || replayEvent.replayEventId}`
    );
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
    const table = document.querySelector('.ui.newReplayReplayEventsTable.table tbody');
    //then for each replay Event we need to add it to the table
    for (let replayEvent in newReplay.replayEventArray) {
        //then use the function that is shared by replays.js
        addNewReplayEventToTable(newReplay, newReplay.replayEventArray[replayEvent], table);
    }
    //then add the link click listeners for the row
    addNewReplayReplayEventsTableButtonListeners();
}

//SLAVE NEW REPLAY EVENTS TABLE OPERATION - THIS ADDS BUTTON LISTENERS FOR SUBORDINATE NEW REPLAY, REPLAY EVENTS TABLE

function addNewReplayReplayEventsTableButtonListeners() {
    $('.ui.newReplayReplayEventsTable.table .showReplayEventRow').on('click', function () {
        console.log('Firing Run New Replay Table Row Show Link');
        //here we deal with messages that are appended to the html as the replay is running
        //we have log messages for all replay events
        const logMessages = JSON.parse($(this).attr('data-log-messages'));
        //we will have error messages for some replay events
        const errorMessages = JSON.parse($(this).attr('data-error-messages'));
        //show the information row
        $('.ui.newReplayReplayEventsTable.table .informationMessageRow').css('display', 'table-row');
        //then what we show depends on the content of the messages
        switch (true) {
            //then if it's empty then we have no messages because the event has been run
            case logMessages.length == 0 && errorMessages.length == 0:
                //show the warning message
                $('.ui.newReplayReplayEventsTable.table .ui.warning.noDetails.message').css('display', 'block');
                break;
            case logMessages.length > 0 && errorMessages.length == 0:
                //empty the lists
                $('.ui.newReplayReplayEventsTable.table .logging.list').empty();
                $('.ui.newReplayReplayEventsTable.table .error.list').empty();
                //hide the error section
                $('.ui.newReplayReplayEventsTable.table .ui.negative.error.message').css('display', 'none');
                //loop through the log messages
                for (let item in logMessages) {
                    //attach the logging messages to the message list
                    $('.ui.newReplayReplayEventsTable.table .logging.list').append(`<li>${logMessages[item]}</li>`);
                }
                //show the logging message
                $('.ui.newReplayReplayEventsTable.table .ui.info.logging.message').css('display', 'block');
                break;
            case errorMessages.length > 0:
                //empty the lists
                $('.ui.newReplayReplayEventsTable.table .logging.list').empty();
                $('.ui.newReplayReplayEventsTable.table .error.list').empty();
                //loop through the log messages
                for (let item in logMessages) {
                    //attach the logging messages to the message list
                    $('.ui.newReplayReplayEventsTable.table .logging.list').append(`<li>${logMessages[item]}</li>`);
                }
                //loop through the error messages
                for (let item in errorMessages) {
                    //attach the error messages to the message list
                    $('.ui.newReplayReplayEventsTable.table .error.list').append(`<li>${errorMessages[item]}</li>`);
                }
                //show the logging message
                $('.ui.newReplayReplayEventsTable.table .ui.info.logging.message').css('display', 'block');
                //show the error message
                $('.ui.newReplayReplayEventsTable.table .ui.negative.error.message').css('display', 'block');
        }
    });

    $('.ui.newReplayReplayEventsTable.table .deleteReplayEventRow').on('click', function () {
        console.log('Firing Run New Replay Table Row Delete Link');
        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr('data-replay-id');
        //do the same with the replay event key
        const replayEventKey = $(this).attr('data-replay-event-id');
        //the replay key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then((replay) => {
                //first we need to create a new replay, with our recording properties and replay properties
                const newReplay = new Replay(replay, replay);
                //then we need to filter the new replay's event table
                newReplay.replayEventArray = newReplay.replayEventArray
                    //get rid of the element that has been deleted, by reference to the replay event id or the aeertion id
                    .filter((item) => item.replayEventId != replayEventKey && item.assertionId != replayEventKey);
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
            //then we need to save the updated replay to the database
            .then((newReplay) =>
                StorageUtils.updateModelObjectInDatabaseTable('replays.js', replayKey, newReplay, 'replays')
            )
            //then we need to retrieve the edited replay to update the table to reflect the deleted event
            .then(() => StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays'))
            //then we need to do the update to the table
            .then((savedReplay) => {
                //empty the table body first
                $('.ui.newReplayReplayEventsTable.table tbody').empty();
                //get a reference to the table
                const table = document.querySelector('.ui.newReplayReplayEventsTable.table tbody');
                //then for each replayEvent we need to add it to the table and the textarea
                for (let replayEvent in savedReplay.replayEventArray) {
                    //then borrow the function from newReplay.js
                    addNewReplayEventToTable(savedReplay, savedReplay.replayEventArray[replayEvent], table);
                }
            })
            //the get single object function will reject if object is not in database
            .catch((error) => console.error(error));
    });
}

function refreshNewReplayRecordingDropdown() {
    //get the tests data from the database so we can have recordings linked to tests
    StorageUtils.getAllObjectsInDatabaseTable('newReplay.js', 'recordings')
        //once we have the array then we can start populating the new test form projects dropdwon by looping through the array
        .then((recordingStorageArray) => {
            //filter recordings for default project by fetching from local storage
            const defaultProjectId = Number(localStorage.getItem('DefaultProject'));
            //if we have any number greater than zero, which indicates no default, then filter
            defaultProjectId > 0
                ? (recordingStorageArray = recordingStorageArray.filter(
                      (recording) => recording.recordingProjectId == defaultProjectId
                  ))
                : null;

            //get a reference to the drop down in the new recording form
            var newReplayDropDownMenu = $('.ui.fluid.selection.newReplay.recording.dropdown .menu');
            //empty the dropdown of existing items
            newReplayDropDownMenu.empty();
            //use for-in loop as execution order is maintained to insert all the tests, with references, in the dropdown
            for (let recording in recordingStorageArray) {
                //we are not going to use templates here as we are not dealing with complex html structures
                newReplayDropDownMenu.append(
                    `<div class="item" data-value=${recordingStorageArray[recording].id}>${recordingStorageArray[recording].recordingName}</div>`
                );
            }
            //then after the entire loop has been executed we need to initialise the dropdown with the updated items
            $('.ui.fluid.selection.newReplay.recording.dropdown').dropdown({
                onChange: function (value) {
                    //data value always returns a string and we need the id in number form
                    const recordingId = Number(value);
                    //then we need to get the right item from the array so we can populate the test start url field in the visible form
                    const recording = recordingStorageArray.find((item) => item.id == recordingId);
                    //populate the visible form but leave it disabled - it's readable but the form does not mutate and require reseting
                    $('.ui.newReplayForm.form input[name=replayName]').val(`${recording.recordingName} (Replay)`);
                    $('.ui.newReplayForm.form input[name=replayRecordingStartUrl]').val(
                        recording.recordingTestStartUrl
                    );
                    //then we want to reset the hidden assertions collector
                    $('.ui.newReplayForm.form input[name="hiddenAssertionsCollector"]').val('[]');
                    //create an array from the recording recording events array with any hover and text select recording events - the only assertable events
                    const assertableArray = recording.recordingEventArray.filter(
                        (item) =>
                            item.recordingEventActionType == 'hover' || item.recordingEventActionType == 'selectstart'
                    );
                    //then populate the table with events, if any
                    addAssertableEventsToTable(recording, assertableArray);
                },
            });
        });
}

//THIS FUNCTION IS SHARED BY REPLAYS.JS
//CHECK BOTH FILES BEFORE MAKING CHANGES
function runExecutionMessageWithFailover(replayEvent) {
    //it is vital to the functioning of the replaying that each event has a timeout
    //we will receive no response if we have a non-matching url from all frames - so if all frames' urls are non-matching = timeout
    //we will receive no response if we get no page navigation onCompleted event = timeout
    //so we need each event to have this promise
    return new Promise((resolve) => {
        //we need to report the time we have waited for the error
        const errorString = `Unmatched URL Timeout (${replayEvent.waitForExecutionTime / 1000} seconds)`;
        //we need to have an error object with the crucial fields resolved by the timeout
        const syntheticExecution = {
            replayEventReplayed: Date.now(),
            replayLogMessages: [],
            replayErrorMessages: [errorString],
            replayEventStatus: false,
        };
        //we run a race between the messenger and our timeout to see which returns first
        Promise.race([
            //the messenger will resolve with a standard messaging response - we are interested in the response replayExecution only
            new RecordReplayMessenger({}).sendMessageGetResponse({ replayEvent: replayEvent }),
            //the timeout will resolve with the error object so the outcomes are uniform in important ways, using the waitForExecutionTime that varies according to replay event type
            new Promise((resolve) =>
                window.setTimeout(() => resolve(syntheticExecution), replayEvent.waitForExecutionTime)
            ),
        ])
            //then we either get back the response or the synthetic object
            .then((replayFeedback) => {
                //always good to log the response from different parts of the extension
                console.log(replayFeedback);
                //set the replay execution - if the feedback has replay execution property then we deal with that, otherwise we deal with the synthetic feedback
                const replayExecution = replayFeedback.hasOwnProperty('replayExecution')
                    ? replayFeedback.replayExecution
                    : replayFeedback;
                //then what we do here depends upon whether the replay event is standard or assertion
                if (replayEvent.assertionId) {
                    replayEvent.assertionEventReplayed = replayExecution.replayEventReplayed;
                    replayEvent.assertionEventStatus = replayExecution.replayEventStatus;
                    replayEvent.assertionLogMessages = replayEvent.assertionLogMessages.concat(
                        replayExecution.replayLogMessages
                    );
                    replayEvent.assertionErrorMessages = replayExecution.replayErrorMessages;
                    //then for the mutated events, it will be useful to know the selector that has actually been chosen in the page
                    if (replayExecution.chosenSelectorReport) {
                        replayEvent.assertionChosenSelectorString = replayExecution.chosenSelectorReport.selectorString;
                    } else {
                        console.log(
                            `No Chosen Selector Report for Assertion Type: ${replayEvent.assertionEventAction}`
                        );
                    }
                } else {
                    replayEvent.replayEventReplayed = replayExecution.replayEventReplayed;
                    replayEvent.replayEventStatus = replayExecution.replayEventStatus;
                    replayEvent.replayLogMessages = replayEvent.replayLogMessages.concat(
                        replayExecution.replayLogMessages
                    );
                    replayEvent.replayErrorMessages = replayExecution.replayErrorMessages;
                    //then for the mutated events, it will be useful to know the selector that has actually been chosen in the page
                    if (replayExecution.chosenSelectorReport) {
                        replayEvent.replayChosenSelectorString = replayExecution.chosenSelectorReport.selectorString;
                    } else {
                        console.log(`No Chosen Selector Report for Replay Type: ${replayEvent.recordingEventAction}`);
                    }
                }
                //the execution time has served its purpose and we don't need it polluting the event array in storage
                delete replayEvent.waitForExecutionTime;
                //then return the replay event
                resolve(replayEvent);
            })
            .catch((error) => console.info(error));
    });
}

//THIS FUNCTION IS SHARED BY REPLAYS.JS AND BULKREPLAY.JS
//CHECK BOTH FILES BEFORE MAKING CHANGES
function processReplayEvents(replay, tableSelector, containerSelector) {
    //start by defining the cancellation observable -merge the two sources of potential recording stop commands
    const cancellationObservable = Rx.Observable.merge(
        //obviously the stop button is a source of finalisation - generalised to negative button so we can use this routine for bulk replays
        Rx.Observable.fromEvent(document.querySelector(`${containerSelector} .ui.negative.button`), 'click')
            //we need to send the message to the background script here
            .do((event) =>
                new RecordReplayMessenger({}).sendMessage({
                    stopReplay: event.target.getAttribute('data-replay-id'),
                })
            ),
        //then the background scripts can also stop the replay when
        // 1) the tab is closed 2) the debugger has failed to attach
        // in either case a message with property replayTabClosed will be sent, when debugger has failed to attach an additional property errorMessage present
        new RecordReplayMessenger({})
            .isAsync(false)
            //subscribe the the observable we only want to receive replayTabClosed events here
            .chromeOnMessageObservable.filter((msgObject) => msgObject.request.hasOwnProperty('replayTabClosed'))
            //send the response so we don't get the silly errors
            .do((msgObject) => {
                if (msgObject.request.hasOwnProperty('errorMessage')) {
                    alert(msgObject.request.errorMessage);
                }
                //this is just to prevent silly errors displayed in the console
                msgObject.sendResponse({ message: `User Interface Received Tab Closed Event` });
            })
    );

    const replayEventsObservable = (replay) => {
        //we want a simple observable from the replay event array, each item has all that we need to instruct the event replayer
        return (
            Rx.Observable.from(replay.replayEventArray)
                //then we need to make sure that the events happen in the same time frame as the recording
                .concatMap((replayEvent) => Rx.Observable.of(replayEvent).delay(replayEvent.recordingTimeSincePrevious))
                //then we only take events until we have a cancellation action of some kind
                .takeUntil(cancellationObservable)
                //then we need to add some properties to the replay event as we start processing
                //we need to have a basic initialisation message to signal processing start AT THIS LEVEL - we combine on feedback
                //we need to have a wait time for getting a response - this will be different for different types of action
                .map((replayEvent) => {
                    //if we have an assertion id, we should add the initialisation statement to the assertion log messages, otherwise normal logging
                    replayEvent.assertionId
                        ? (replayEvent.assertionLogMessages = ['Assertion Initialised'])
                        : (replayEvent.replayLogMessages = ['Replay Initialised']);
                    //then we need to have an execution wait time, we need a long wait time for page actions as it waits for load, otherwise a shorter time to allow for scroll
                    replayEvent.recordingEventAction == 'Page'
                        ? (replayEvent.waitForExecutionTime = 20000)
                        : (replayEvent.waitForExecutionTime = 2000);
                    //then return the replay event
                    return replayEvent;
                })
                //then we have to map each event in the replay event array to the response from listeners
                //listeners include ALL FRAMES IN THE PAGE, AS WELL AS THE BACKGROUND TAB RUNNER (FOR KEYBOARD AND NAVIGATION)
                .concatMap((replayEvent) => Rx.Observable.fromPromise(runExecutionMessageWithFailover(replayEvent)))
                //and we need to start with a dummy marker so we can operate with only one emission, this must come before pairwise() to create the first pair
                //as replay event is an extension of recording event, we need to pass in recording object and blank replay options object
                .startWith(new ReplayEvent({ recordingEventOrigin: 'PairwiseStart' }, {}))
                //then we need to get the time between each emission so we take two emissions at a time
                .pairwise()
                //this then delivers an array with the previous and the current, we only need the current, with adjusted recordingTimeSincePrevious
                .map(([previousReplayEvent, currentReplayEvent]) => {
                    //if the previous was not the dummy 'PairwiseStart', then we need to add the relative time of the replay event execution
                    //if it is then the time since previous will be 0, with zero delay, which is what we want
                    if (previousReplayEvent.recordingEventOrigin != 'PairwiseStart') {
                        //then we are going to want to know when the previous event was replayed, which is different for assertions and normal replay events
                        const previousEventReplayed =
                            previousReplayEvent.assertionEventReplayed || previousReplayEvent.replayEventReplayed;
                        //then we are going to need to know when the current event was replayed, which is again different
                        const currentEventReplayed =
                            currentReplayEvent.assertionEventReplayed || currentReplayEvent.replayEventReplayed;
                        //then we need to add the difference to the right property, according to whether it is an assertion or not
                        if (currentReplayEvent.assertionId) {
                            //the assertion time since previous needs to be updated
                            currentReplayEvent.assertionTimeSincePrevious =
                                currentEventReplayed - previousEventReplayed;
                        } else {
                            //the replay time since previous  needs to be updated
                            currentReplayEvent.replayTimeSincePrevious = currentEventReplayed - previousEventReplayed;
                        }
                    }
                    //in both cases we only need to return the current replay event, which will return all apart from the dummy pairwise start
                    return currentReplayEvent;
                })
                //then we need to update the user interface
                .do((replayEvent) => {
                    //we need to work out if we are working with replay or assertion id
                    const targetId = replayEvent.assertionId || replayEvent.replayEventId;
                    //find the row in the table that corresponds with the replay event id or the assertionid
                    const $targetTableRow = $(`${tableSelector} tr[data-replay-event-id='${targetId}']`);
                    //we need to work out if we are dealing with replay or assertion success / failure
                    const status = replayEvent.assertionEventStatus || replayEvent.replayEventStatus;
                    //then add the class to indicate success or failure
                    status == true ? $targetTableRow.addClass('positive') : $targetTableRow.addClass('negative');
                    //then we need to work out if we are working with replay or assertion time since previous
                    const timeSincePrevious =
                        replayEvent.assertionTimeSincePrevious || replayEvent.replayTimeSincePrevious;
                    //then we need to work out if we are working with replay or assertion eventReplayed
                    const timeReplayed = replayEvent.assertionEventReplayed || replayEvent.replayEventReplayed;
                    //then do some work to create a nice looking time since previous
                    const timeSincePreviousString =
                        timeSincePrevious == 0
                            ? new Date(timeReplayed).toLocaleString()
                            : `+ ${Math.ceil(timeSincePrevious / 1000)} sec`;
                    //then we need to add this to the relevant table row
                    $targetTableRow
                        .children('td[data-label="replay_timestamp_executed"]')
                        .text(timeSincePreviousString);
                    //finally we need to work the messages
                    const logMessages = replayEvent.assertionLogMessages || replayEvent.replayLogMessages;
                    //add the stringified logmessages array to the show link
                    $targetTableRow.find('.showReplayEventRow').attr('data-log-messages', JSON.stringify(logMessages));
                    const errorMessages = replayEvent.assertionErrorMessages || replayEvent.replayErrorMessages;
                    //add the stringified logmessages array to the show link
                    $targetTableRow
                        .find('.showReplayEventRow')
                        .attr('data-error-messages', JSON.stringify(errorMessages));
                })
        );
    };

    //we use a promise as the processing of replay events is of uncertain duration
    return new Promise((resolve, reject) => {
        //we start off with the replay as we will be needing to update the replay as each event is tested and mutated with the results
        Rx.Observable.of(replay)
            //send the message to the background script to start the replay processes
            .switchMap(
                (replay) =>
                    //in the background scripts, there is some time required to set up the active replay and the tab runner
                    //we do not want to start processing events until this happens so we send the message and wait for the response
                    Rx.Observable.fromPromise(
                        new RecordReplayMessenger({}).sendMessageGetResponse({ newReplay: replay })
                    ),
                //if we have an error in the initial setup, for example with debugger failing to attach, then this will be reported here
                (readyStateReplay, response) => {
                    if (response.message.includes('Cannot attach to this target')) {
                        //change the UI
                        //show the stop replay button as disabled
                        $(`${containerSelector} .ui.stopReplay.negative.button`).addClass('disabled');
                        $(`${containerSelector} .ui.startReplay.positive.button`).addClass('disabled');
                        //hide the replay loader
                        $(`${containerSelector} .ui.text.small.replay.loader`).removeClass('active');
                        //remove all the indicators from the table rows, apart from disabled and assertion row
                        $(`${tableSelector} tr`).removeClass('warning');
                        //then alert the user to this fatal error
                        alert(
                            `Chrome Remote Debugging: ${response.message}\nhttps://bugs.chromium.org/p/chromium/issues/detail?id=885025`
                        );
                        readyStateReplay.terminated = true;
                    } else {
                        readyStateReplay.terminated = false;
                    }
                    return readyStateReplay;
                }
            )
            //then we filter in only the ones we want to keep
            .filter((x) => x.terminated === false)
            //we want to keep track of how the replay performs without making changes to original replay events of the the replay - so we add the mutated replay event array
            .map((replay) => Object.assign({}, replay, { mutatedReplayEventArray: [] }))
            //then switch map into an observable of the replay's events, so we can process each event individually
            .switchMap(
                (replay) => replayEventsObservable(replay),
                //then use the projection function to tie the two together
                (replay, mutatedReplayEvent) => {
                    //then we need to update the array
                    replay.mutatedReplayEventArray.push(mutatedReplayEvent);
                    //then return the replay so it can be updated in the database
                    return replay;
                }
            )
            .subscribe(
                (mutatedReplay) => {
                    //RUNNING TOTALS
                    //we need to know the progress of the test, which we can assess by seeing how many events have been pushed to the mutated events array
                    const numberMutated = mutatedReplay.mutatedReplayEventArray.length;
                    //we need to know how many of the replays have failed. which we can do by filtering for false - unperformed replays have a value of null
                    const numberFailed = mutatedReplay.mutatedReplayEventArray.filter(
                        (event) => event.assertionEventStatus == false || event.replayEventStatus == false
                    ).length;
                    //we need to know how many tests have passed, which we get from the positives
                    const numberPassed = mutatedReplay.mutatedReplayEventArray.filter(
                        (event) => event.assertionEventStatus == true || event.replayEventStatus == true
                    ).length;
                    console.log(`Tested: ${numberMutated}, Failed: ${numberFailed}, Passed: ${numberPassed}`);

                    //then we check to see if we have completed the processing
                    if (numberMutated == mutatedReplay.replayEventArray.length) {
                        console.log('Replay Complete by Events');
                        //then we have to update the replay with the time that this replay was performed
                        mutatedReplay.replayExecuted = Date.now();
                        //then we add the replay status
                        mutatedReplay.replayStatus = numberMutated == numberPassed ? true : false;
                        //then we add the fail time if required, otherwise set it to zero
                        numberMutated != numberPassed
                            ? (mutatedReplay.replayFailTime = Date.now())
                            : (mutatedReplay.replayFailTime = 0);
                        //then resolve with the mutated replay
                        resolve(mutatedReplay);
                    }
                },
                (error) => reject(error)
            );
    });
}

//THIS FUNCTION IS SHARED BY REPLAYS.JS
//CHECK BOTH FILES BEFORE MAKING CHANGES
function runVisualRegressionAnalysis(containerSelector, previousRunImage, currentRunImage) {
    //enter the previous image to perform basic analysis
    resemble(`data:image/jpeg;base64,${previousRunImage}`)
        //enter the second image to provide a comparison
        .compareTo(`data:image/jpeg;base64,${currentRunImage}`)
        //scale second image to dimensions of the first one
        .scaleToSameSize()
        //antialiasing can produce a lot of noise that we don't need
        .ignoreAntialiasing()
        //set the output settings
        .outputSettings({
            //set the error colour as bright pink
            errorColor: { red: 255, green: 0, blue: 255 },
            //just treat all differences the same
            errorType: 'flat',
            //then produce an image that is slightly transparent to highlight differences
            transparency: 0.8,
            //useCrossOrigin is true by default, you might need to set it to false if you're using Data URIs.
            useCrossOrigin: false,
            //then produce output image
            outputDiff: true,
        })
        //then on complete we can update the UI
        .onComplete(function (data) {
            console.log(data);
            if (data.rawMisMatchPercentage > 0) {
                //save the diff image data uri
                const diffImage = data.getImageDataUrl();
                //update the previous run image src
                $(`${containerSelector} .previousRunImage`).prop('src', `data:image/jpeg;base64,${previousRunImage}`);
                //update the current run image src
                $(`${containerSelector} .currentRunImage`).prop('src', `data:image/jpeg;base64,${currentRunImage}`);
                //update the image diff image src
                $(`${containerSelector} .visualRegressionImage`).prop('src', `${diffImage}`);
                //show the relevant image analysis segment
                $(`${containerSelector} .ui.basic.visualChanges.segment`).show();
            }
        });
}

function addNewReplayEventsTableStartReplayHandler() {
    //REPLAYING EVENTS START HANDLER
    Rx.Observable.fromEvent(document.querySelector('.ui.replayEvents.segment .ui.startReplay.positive.button'), 'click')
        //we only need to take one of these clicks at a time, the listener is refreshed on completion
        .take(1)
        //make the changes to the ui to indicate that we have started
        .do((event) => {
            //show the start replay button as disabled
            event.target.className += ' disabled';
            //show the stop replay button as enabled
            $('.ui.replayEvents.segment .ui.stopReplay.negative.button').removeClass('disabled');
            //remove all the indicators from the table rows, apart from disabled and assertion row
            $(`.ui.newReplayReplayEventsTable.table tr`).removeClass('positive');
            $(`.ui.newReplayReplayEventsTable.table tr`).removeClass('negative');
            //show the replay loader
            $('.ui.replayEvents.segment .ui.text.small.replay.loader').addClass('active');
            //and hide the 'replay has not run' message
            $('.ui.newReplayReplayEventsTable.table .ui.warning.noDetails.message').css('display', 'none');
            //and the various logging messages
            $('.ui.newReplayReplayEventsTable.table .ui.info.logging.message').css('display', 'none');
            $('.ui.newReplayReplayEventsTable.table .ui.negative.error.message').css('display', 'none');
            //then report to Google analytics so we can see how often replays happen
            ga('send', {
                hitType: 'event',
                eventCategory: 'NewReplayRun',
                eventAction: `Click`,
                eventLabel: 'ReplayCreationData',
            });
        })
        //get the replay from storage using the data id from the button
        .switchMap((event) =>
            Rx.Observable.fromPromise(
                StorageUtils.getSingleObjectFromDatabaseTable(
                    'replays.js',
                    event.target.getAttribute('data-replay-id'),
                    'replays'
                )
            )
        )
        //process the replay using the routine from newreplay.js
        .flatMap((replay) =>
            Rx.Observable.fromPromise(
                processReplayEvents(replay, '.ui.newReplayReplayEventsTable.table', '.ui.replayEvents.segment')
            )
        )
        //then we need to collect any reports that may be required for this replay from the replay's tab runner
        .switchMap(
            () =>
                //send the message and wait for the response promise to be fulfilled
                Rx.Observable.fromPromise(
                    new RecordReplayMessenger({}).sendMessageGetResponse({
                        getReportObject: 'Make Request for Report Object',
                    })
                ),
            (mutatedReplay, response) => {
                //update the performance timings if required
                mutatedReplay.recordingTestPerformanceTimings
                    ? (mutatedReplay.replayPerformanceTimings = response.reportObject.performanceTimings)
                    : null;
                //update the resource loads if required
                mutatedReplay.recordingTestResourceLoads
                    ? (mutatedReplay.replayResourceLoads = response.reportObject.resourceLoads)
                    : null;
                //if the user has selected visual regression analysis, and we have a previous screenshot, now is the time to do it
                if (
                    mutatedReplay.recordingTestVisualRegression &&
                    mutatedReplay.hasOwnProperty('replayScreenShot') &&
                    Object.keys(mutatedReplay.replayScreenShot).length > 0
                ) {
                    //the function needs to have the container to find the images, the current screenshot saved to the database and the reported screenshot
                    runVisualRegressionAnalysis(
                        '.ui.replayEvents.segment',
                        mutatedReplay.replayScreenShot.data,
                        response.reportObject.screenShot.data
                    );
                }
                //update the screenshot if required
                mutatedReplay.recordingTestScreenshot
                    ? (mutatedReplay.replayScreenShot = response.reportObject.screenShot)
                    : null;
                //return mutated replay with reports
                return mutatedReplay;
            }
        )
        //then we need to save the updated replay events and any reports to the database
        .switchMap(
            (mutatedReplayReports) =>
                Rx.Observable.fromPromise(
                    StorageUtils.updateModelObjectInDatabaseTable(
                        'replays.js',
                        mutatedReplayReports.id,
                        mutatedReplayReports,
                        'replays'
                    )
                ),
            //then just return the active replay
            (updatedActiveReplay) => updatedActiveReplay
        )
        //then we need to send the command to close the debugger
        .switchMap(
            (replay) =>
                Rx.Observable.fromPromise(
                    new RecordReplayMessenger({}).sendMessageGetResponse({ stopNewReplay: replay })
                ),
            //then just log the response and return the active replay
            (activeReplay, response) => {
                console.log(response.message);
                return activeReplay;
            }
        )
        //then we need to report the conclusion of the process - we only have a single replay to report
        .subscribe(
            (replay) => {
                console.log(`Finished Processing ${replay.replayName}`);
                //update the master replays table at the top to reflect executed time and status
                updateReplaysTable();
                //hide the replay loader
                $('.ui.replayEvents.segment .ui.text.small.replay.loader').removeClass('active');
                //show the start button as enabled
                $('.ui.replayEvents.segment .ui.startReplay.positive.button').removeClass('disabled');
                //show the stop replay button as disabled
                $('.ui.replayEvents.segment .ui.stopReplay.negative.button').addClass('disabled');
                //then we need to add the start recording handler again
                addNewReplayEventsTableStartReplayHandler();
            },
            (error) => {
                console.error(`Process Replay Error ${error}`);
                //hide the replay loader
                $('.ui.replayEvents.segment .ui.text.small.replay.loader').removeClass('active');
                //show the start button as enabled
                $('.ui.replayEvents.segment .ui.startReplay.positive.button').removeClass('disabled');
                //show the stop replay button as disabled
                $('.ui.replayEvents.segment .ui.stopReplay.negative.button').addClass('disabled');
                //then we need to add the start recording handler again
                addNewReplayEventsTableStartReplayHandler();
            }
        );
}

$(document).ready(function () {
    //add the listener for the run replay button
    addNewReplayEventsTableStartReplayHandler();

    //add the listener for visual check image blowup
    //THIS FUNCTION IS USED ACROSS THE WHOLE PAGE WITH ANY VISUAL REGRESSION IMAGES
    $('.previousRunImage, .currentRunImage, .visualRegressionImage').on('click', function () {
        //first we want to get the target src
        const src = $(this).prop('src');
        //then we set the modal src
        $('.ui.large.modal .visualCheckBlowUp').prop('src', src);
        //then we show the modal
        $('.large.modal').modal('show');
        //then report to Google analytics so we can see how often replays happen
        ga('send', {
            hitType: 'event',
            eventCategory: 'ReplayVisualChange',
            eventAction: `Click`,
            eventLabel: 'ReplayUseData',
        });
    });

    $('.ui.newReplayForm.form').form({
        on: 'blur',
        fields: {
            replayRecordingId: {
                identifier: 'replayRecordingId',
                rules: [{ type: 'empty', prompt: 'Please select a recording for replay' }],
            },
            replayName: {
                identifier: 'replayName',
                rules: [{ type: 'empty', prompt: 'Please enter replay name by selecting a recording' }],
            },
            replayRecordingStartUrl: {
                identifier: 'replayRecordingStartUrl',
                rules: [{ type: 'empty', prompt: 'Please enter start url by selecting a recording' }],
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
            //hide the image analysis segment
            $('.ui.replayEvents.segment .ui.basic.visualChanges.segment').hide();
            //then we can start to create our new replay, starting with the fetching of the recording from the database
            const recordingKey = fields.replayRecordingId;
            //the recording key will be in string format - StorageUtils handles conversion
            StorageUtils.getSingleObjectFromDatabaseTable('recordings.js', recordingKey, 'recordings')
                //then we have a returned js object with the recording details
                .then((recording) => {
                    //then we need to make sure the replay's recording id is in a number format, so we can search and delete
                    fields.replayRecordingId = StorageUtils.standardiseKey(fields.replayRecordingId);
                    //then we need to create our new replay, which is an extension of recording and has its own fields as well
                    //we can just push the fields in the constructor, any non-defaults just get ignored
                    const newReplay = new Replay(recording, fields);
                    //then we need to add all the replay events by extending the recording events, with the ability to customise in options object
                    newReplay.replayEventArray = recording.recordingEventArray.map(
                        (recordingEvent) => new ReplayEvent(recordingEvent, {})
                    );
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
                .then((newReplay) => StorageUtils.addModelObjectToDatabaseTable('newReplay.js', newReplay, 'replays'))
                //then we need to get all the replay UI ready to start replay, for which we need the replay with the id
                .then((createdReplayId) =>
                    StorageUtils.getSingleObjectFromDatabaseTable('newReplay.js', createdReplayId, 'replays')
                )
                //then we need to do the updates
                .then((savedReplay) => {
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
                    $('.ui.replayEvents.segment .ui.startReplay.positive.button').removeClass('disabled');
                    //change the data-replay-id of the start and stop buttons, so we can retrieve the replay on replay start
                    $(
                        '.ui.replayEvents.segment .ui.startReplay.positive.button, .ui.replayEvents.segment .ui.stopReplay.negative.button'
                    ).attr('data-replay-id', savedReplay.id);
                    //then we want to reset the hidden assertions collector
                    $('.ui.newReplayForm.form input[name="hiddenAssertionsCollector"]').val('[]');
                    //then report to Google analytics so we can see how often replays happen
                    ga('send', {
                        hitType: 'event',
                        eventCategory: 'NewReplayCreate',
                        eventAction: `Click`,
                        eventLabel: 'ReplayCreationData',
                    });
                })
                //the get single object function will reject if object is not in database
                .catch((error) => console.error(error));
        },
    });
});
