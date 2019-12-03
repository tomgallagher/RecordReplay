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

    } else {
         //hide the assertions field
         $('.optionalAssertions').css('display', 'none');
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
                    $('.ui.newReplayForm.form input[name=replayName]').val(`${recording.recordingName}#${dateString}`);
                    $('.ui.newReplayForm.form input[name=replayRecordingStartUrl]').val(recording.recordingTestStartUrl);

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
                //console.log(event);
                //always need to have this with a submit button otherwise the entire page reloads
                event.preventDefault();
                //add the loading indicator to the button, to indicate saving of the test to the database
                $('.ui.newReplayForm .ui.submit.button').addClass('loading');

                //remove the loading indicator from the button
                $('.ui.newReplayForm .ui.submit.button').removeClass('loading');
            }

        });

});