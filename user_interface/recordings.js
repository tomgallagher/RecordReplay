function addRecordingTableRowsFragment(recordingStorageArray) {

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
        let recordingCreatedNode = tempNode.querySelector('td[data-label="recordingCreated"]');
        recordingCreatedNode.textContent = new Date(recordingStorageArray[recording].recordingCreated).toLocaleString(); 

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

}

//make sure the edit recording test dropdown shows an updated account of the tests in storage
function refreshEditRecordingTestDropdown() {

    //get the tests data from the database so we can have recordings linked to tests
    StorageUtils.getAllObjectsInDatabaseTable('recordings.js', 'tests')
        //once we have the array then we can start populating the new recording form tests dropdoqn by looping through the array
        .then(testStorageArray => {

            //get a reference to the drop down in thee edit recording form
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

function addRecordingTablePaginationListener() {

    $('.ui.recordingsTable .ui.pagination.menu .item').on('click', function(){

        //get the current page displayed, set to zero by default
        var currentPage = Number($('.ui.recordingsTable .ui.pagination.menu').attr('data-current-page'));
        //get the classes of the active item as a list
        const classArray = $(this).attr('class').split(/\s+/);
        //then get all the current recordings from the database, as an array
        StorageUtils.getAllObjectsInDatabaseTable('recordings.js', 'recordings')
            //once we have the array then we can start populating the table by looping through the array
            .then(recordingStorageArray => {
                
                //then we paginate here using the class
                const paginator = new Pagination(recordingStorageArray);
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
                $('.ui.recordingsTable .ui.pagination.menu').attr('data-current-page', currentPage);
                //then set the storage array to the current page 
                recordingStorageArray = paginator.getParticularPage(currentPage);
                //then update the table
                addRecordingTableRowsFragment(recordingStorageArray);
                
        });

    });

}

function addRecordingTableButtonListeners() {

    //edit recording button click handler
    $('.showRecordingLink').on('click', function(){
        //find the recording in the database by id, using data-recording-id from the template
        const recordingKey = $(this).attr("data-recording-id");
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('recordings.js', recordingKey, 'recordings')
            //then we have a returned js object with the recording details
            .then(recording => {
                //make sure we always have events showing
                $('.ui.fluid.showRecording.container .ui.top.attached.recording.tabular.menu .item[data-tab="recordingEvents"]').click();
                //show the section that has the table in one tab and the code in another tab
                $('.ui.fluid.showRecording.container').css('display', 'block');
                //add the loading indicator to the table section
                $('.ui.fluid.showRecording.container .ui.bottom.attached.active.tab.segment ').addClass('loading');
                //update the checkboxes to have the current recording id                
                $('.ui.code.form .ui.radio.checkbox input[name="outputCodeType"]').attr('data-recording-id', recordingKey);
                //then update the edit recording events table
                updateRecordingEventsTableAndCodeText(recording);
                //then remove the loading indicator
                $('.ui.fluid.showRecording.container .ui.bottom.attached.active.tab.segment ').removeClass('loading');
            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));   

    });

    //edit recording button click handler
    $('.editRecordingLink').on('click', function(){
        
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
    $('.deleteRecordingLink').on('dblclick', function(){
        
        //close the edit recording form if it's open
        $('.editRecordingFooter').css("display", "none");
        //close the show recording / edit recording recordingEvents table
        $('.ui.fluid.showRecording.container').css('display', 'none');
        //delete the recording in the database, using data-recording-id from the template
        const recordingKey = $(this).attr("data-recording-id");
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.cascadeDeleteByRecordingID('recordings.js', recordingKey)
            //then we have nothing returned
            .then( () => {
                //then redraw the table
                updateRecordingsTable();
                //then run the function that enables the buttons
                enableVerticalMenuButtonsWhenDataAllows();
            })
            //the delete single object function will reject if object is not in database
            .catch( () => console.error(`Error Deleting Recording ${recordingKey}`));

    });

}

function updateRecordingsTable() {

    //first get all the current recordings from the database, as an array, then loop through the array to update the UI
    StorageUtils.getAllObjectsInDatabaseTable('recordings.js', 'recordings')
        //once we have the array then we can start populating the table by looping through the array
        .then(recordingStorageArray => {

            //then we paginate here using the class
            const paginator = new Pagination(recordingStorageArray);
            //first we want to get the number of pages
            if (paginator.getTotalPagesRequired() > 1) {
                //then, if we have a number greater than 1 we need to build the paginator menu
                const menu = paginator.buildMenu(paginator.getTotalPagesRequired());
                //then grab the menu holder and empty it
                $('.ui.recordingsTable .paginationMenuHolder').empty();
                //then append our menu 
                $('.ui.recordingsTable .paginationMenuHolder').append(menu);
                //then show the menu holder
                $('.ui.recordingsTable .paginationMenuRow').css("display", "table-row");
                //then activate the buttons
                addRecordingTablePaginationListener();
            }
            //then make sure the table is showing the first page
            recordingStorageArray = paginator.getParticularPage(1);
            //then update the table
            addRecordingTableRowsFragment(recordingStorageArray);

        });

}


function addRecordingEventTableButtonListeners() {

    //delete recording event button click handler
    $('.ui.editRecordingRecordingEventsTable .deleteRecordingEventRow').on('click', function(){
        //close the event details form if it's open
        $('.ui.editRecordingRecordingEventsTable .viewDetailedTableEventsFooter').css("display", "none");
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

    //show recording event button click handler
    $('.ui.editRecordingRecordingEventsTable .showRecordingEventRow').on('click', function(){
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
                $('.ui.viewRecordingEvent.form input[name=recordingEventLocation]').val(recordingEvent.recordingEventLocationHref);
                //then the checkbox
                recordingEvent.recordingEventIsIframe == true ? $('.ui.viewRecordingEvent .ui.checkbox input[name=recordingEventIsIframe]').prop('checked', true) : $('.ui.viewRecordingEvent .ui.checkbox input[name=recordingEventIsIframe]').prop('checked', false);
                //then if the recording event is either a hover or a text select, we can fill the target strucure
                switch(true) {
                    case recordingEvent.recordingEventAction == 'Mouse' && recordingEvent.recordingEventActionType == 'hover':
                        //on each call we empty the list container we are using to create a dom structure
                        $('.recordingEventTargetStructureList').empty();
                        //then we deliver the pre-cooked html fragment from the Node builder, which loops through the DOM structure to create a tree
                        //we can use the same builder for recordings and replays just by adding the isReplay marker as false, which shows no assertion checkboxes
                        $('.recordingEventTargetStructureList').append(new NodeBuilder({isReplay: false, eventId: recordingEventKey}).build(recordingEvent.recordingEventHoverTargetAsJSON));
                        //then once it has been built, and added, then we are ready to show the display
                        $('.recordingEventTargetStructureDisplay').show();
                        break;
                    case recordingEvent.recordingEventAction == 'TextSelect' && recordingEvent.recordingEventActionType == 'selectstart':
                        //same thing here, with a different recording event property to work on
                        $('.recordingEventTargetStructureList').empty();
                        //the text selection has a slightly different collection method, separating the two for the time being allws more optionality, via properties passed to builder
                        $('.recordingEventTargetStructureList').append(new NodeBuilder({isReplay: false, eventId: recordingEventKey}).build(recordingEvent.recordingEventTextSelectTargetAsJSON));
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
        addNewRecordingEventToTable(recording, recording.recordingEventArray[recordingEvent], table);
    }
    //make sure the code text area is the same height as the table, to indicate the number of events
    $('.ui.fluid.showRecording.container .codeOutputTextArea').css("max-height", "none");
    $('.ui.fluid.showRecording.container .codeOutputTextArea').height($('.ui.fluid.showRecording.container .editRecordingRecordingEventsTable ').height());

    //for code, we use Javascript as default
    const toJavascript = new JavascriptTranslator({});
    $('.ui.fluid.showRecording.container .codeOutputTextArea').val(toJavascript.buildRecordingStringFromEvents(recording.recordingEventArray));
    //add recording events table button listeners
    addRecordingEventTableButtonListeners();

}

$(document).ready (function(){

    //activate the tab control
    $('.ui.showRecording.container .ui.top.attached.recording.tabular.menu .item').tab({
        //we need to rehide stuff as tabs are shown
        'onVisible': function(tab) {
            switch (tab) {
                case 'recordingCode':
                    //close the event details form if it's open so it's gone when we come back
                    $('.ui.editRecordingRecordingEventsTable .viewDetailedTableEventsFooter').css("display", "none");
                    //init the checkbox, with Javascript checked as default
                    $('.ui.showRecording.container .ui.radio.checkbox input[value=javascript]').prop('checked', true);
                    break;
                case 'recordingEvents':
                    //nothing to do here at the moment
            }
        }
    });

    //activate the copy to clipboard button
    $('.ui.showRecording.container .ui.copyCodeToClipBoard.icon.button').on('click', function() {
        //get the text from the text area
        const textToCopy = $('.ui.showRecording.container .codeOutputTextArea').val();
        //then paste that into the clipboard
        navigator.clipboard.writeText(textToCopy);
    });

    //activate the download code as js file button
    $('.ui.showRecording.container .ui.downloadCodeToFile.submit.button').on('click', function(event) {
        //make sure the submit button does not perform its usual reload function
        event.preventDefault();
        //get the text from the text area
        const textToCopy = $('.ui.showRecording.container .codeOutputTextArea').val();
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
    $('.ui.showRecording.container .ui.code.form .ui.radio.checkbox').change(event => {
        //get the recording from the database using the key
        const recordingKey = event.target.getAttribute("data-recording-id");
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('recordings.js', recordingKey, 'recordings')
            //then depending up the recording, fill the code text
            .then(recording => {
                switch(true) {
                    case event.target.value == "javascript":
                        const toJavascript = new JavascriptTranslator({});
                        $('.ui.showRecording.container .codeOutputTextArea').val(toJavascript.buildRecordingStringFromEvents(recording.recordingEventArray));
                        break;
                    case event.target.value == "jquery":
                        const toJquery = new jQueryTranslator({}); 
                        $('.ui.showRecording.container .codeOutputTextArea').val(toJquery.buildRecordingStringFromEvents(recording.recordingEventArray));
                        break;
                    case event.target.value == "puppeteer":
                        const toPuppeteer = new PuppeteerTranslator({});
                        //we pass the whole recording to Puppeteer as it needs other values for set up
                        $('.ui.showRecording.container .codeOutputTextArea').val(toPuppeteer.buildRecordingStringFromEvents(recording));
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
                        //clear the edit recording form
                        $('.ui.editRecordingForm.form').form('clear');
                        //hide the edit recording form container
                        $('.editRecordingFooter').css("display", "none");
                    })
                    .catch( () => console.error(`Error Updating Recording ${fields.hiddenRecordingId}`));
                
            }

        });

});