//MASTER REPLAY TABLE POPULATION - THIS SHOWS ALL THE REPLAYS, PAGINATES THE REPLAYS AND ADDS THE TABLE ROWS VIA FUNCTION

function updateReplaysTable() {

    //first get all the current replays from the database, as an array, then loop through the array to update the UI
    StorageUtils.getAllObjectsInDatabaseTable('replays.js', 'replays')
        //once we have the array then we can start populating the table by looping through the array
        .then(replayStorageArray => {

            //then we paginate here using the class
            const paginator = new Pagination(replayStorageArray);
            //first we want to get the number of pages
            if (paginator.getTotalPagesRequired() > 1) {
                //then, if we have a number greater than 1 we need to build the paginator menu
                const menu = paginator.buildMenu(paginator.getTotalPagesRequired());
                //then grab the menu holder and empty it
                $('.ui.replaysTable .paginationMenuHolder').empty();
                //then append our menu 
                $('.ui.replaysTable .paginationMenuHolder').append(menu);
                //then show the menu holder
                $('.ui.replaysTable .paginationMenuRow').css("display", "table-row");
                //then activate the buttons
                addReplayTablePaginationListener();
            }
            //then make sure the table is showing the first page
            replayStorageArray = paginator.getParticularPage(1);
            //then update the table
            addReplayTableRowsFragment(replayStorageArray);

        });

}

//MASTER REPLAY TABLE POPULATION - THIS FUNCTION DELIVERS TABLE ROWS INTO THE MASTER REPLAY TABLE

function addReplayTableRowsFragment(replayStorageArray) {

    //add the loading indicator to the segment
    $('.ui.savedReplays.verticalTabMenu.segment').addClass('loading');
    //empty the replays table body so we can add the updated information
    $('.ui.celled.replaysTable.table tbody').empty();
    //target our table row template first, we only need to find the template once
    let targetNode = document.querySelector('.replayTableRowTemplate');
    //we need to do more work as we have to save the template in a table, which we don't need, we just want the row
    let targetRow = targetNode.querySelector('tr');
    //then create a document fragment that we will use as a container for each looped template
    let docFrag = document.createDocumentFragment();

    //use for-in loop as execution order is maintained
    for (let replay in replayStorageArray) { 

        //then we make a clone of the row, that will serve the purpose
        let tempNode = targetRow.cloneNode(true);
        //<td data-label="replayName"></td>
        let replayNameNode = tempNode.querySelector('td[data-label="replayName"]');
        replayNameNode.textContent = replayStorageArray[replay].replayName;
        //<td data-label="replay_recordingProjectName"></td>
        let replayProjectNameNode = tempNode.querySelector('td[data-label="replay_recordingProjectName"]');
        replayProjectNameNode.textContent = replayStorageArray[replay].recordingProjectName;
        //<td data-label="replay_recordingTestName"></td>
        let replayTestNameNode = tempNode.querySelector('td[data-label="replay_recordingTestName"]');
        replayTestNameNode.textContent = replayStorageArray[replay].recordingTestName;
        //<td data-label="replayRecordingStartUrl" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;"></td>
        let replayStartUrlNode = tempNode.querySelector('td[data-label="replayRecordingStartUrl"]');
        replayStartUrlNode.textContent = replayStorageArray[replay].replayRecordingStartUrl;
        //<td data-label="replayAssertionsCount"></td>
        let replayAssertionsLengthNode = tempNode.querySelector('td[data-label="replayAssertionsCount"]');
        replayAssertionsLengthNode.textContent = replayStorageArray[replay].replayEventArray.filter(item => item.hasOwnProperty('assertionId')).length;
        //<td data-label="replayCreated"></td>
        let replayCreatedNode = tempNode.querySelector('td[data-label="replayCreated"]');
        replayCreatedNode.textContent = new Date(replayStorageArray[replay].replayCreated).toLocaleString();
        //<td data-label="replayExecuted"></td>
        let replayExecutedNode = tempNode.querySelector('td[data-label="replayExecuted"]');
        //this makes a very shallow copy of the replay WITH NONE OF THE RIGHT RECORDING PARAMETERS to access the formatting functions
        replayExecutedNode.textContent = new Replay({}, replayStorageArray[replay]).printExecutionTime();
        //<td data-label="replayStatus"></td>
        let replayStatusNode = tempNode.querySelector('td[data-label="replayStatus"]');
        //this makes a very shallow copy of the replay WITH NONE OF THE RIGHT RECORDING PARAMETERS to access the formatting functions
        replayStatusNode.textContent = new Replay({}, replayStorageArray[replay]).printStatus();

        let replayShowLink = tempNode.querySelector('.showReplayLink');
        replayShowLink.setAttribute('data-replay-id', `${replayStorageArray[replay].id}`);
        let replayEditLink = tempNode.querySelector('.runReplayLink');
        replayEditLink.setAttribute('data-replay-id', `${replayStorageArray[replay].id}`);
        let replayDeleteLink = tempNode.querySelector('.deleteReplayLink');
        replayDeleteLink.setAttribute('data-replay-id', `${replayStorageArray[replay].id}`);
        //then we need to attach the clone of the template node to our container fragment
        docFrag.appendChild(tempNode);
    
    }

    //then after the entire loop has been executed we need to adjust the dom in one hit, avoid performance issues with redraw
    //then we find the relevant table, using docuement.querySelector which helpfully returns the first Element within the document that matches the specified selector
    let replayTable = document.querySelector('.ui.celled.replaysTable.table tbody');
    //then we append the fragment to the table
    replayTable.appendChild(docFrag);
    //then once all the work has been done remove class
    $('.ui.savedReplays.verticalTabMenu.segment').removeClass('loading');
    //then add the listeners for the buttons built into the form
    addReplayTableButtonListeners();

}

//MASTER REPLAY TABLE OPERATION - THIS ADDS PAGINATION TO THE MASTER REPLAY TABLE

function addReplayTablePaginationListener() {

    $('.ui.replaysTable .ui.pagination.menu .item').on('mousedown', function(){

        //get the current page displayed, set to zero by default
        var currentPage = Number($('.ui.replaysTable .ui.pagination.menu').attr('data-current-page'));
        //get the classes of the active item as a list
        const classArray = $(this).attr('class').split(/\s+/);
        //then get all the current recordings from the database, as an array
        StorageUtils.getAllObjectsInDatabaseTable('replays.js', 'replays')
            //once we have the array then we can start populating the table by looping through the array
            .then(replayStorageArray => {
                
                //then we paginate here using the class
                const paginator = new Pagination(replayStorageArray);
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
                $('.ui.replaysTable .ui.pagination.menu').attr('data-current-page', currentPage);
                //then set the storage array to the current page 
                replayStorageArray = paginator.getParticularPage(currentPage);
                //then update the table
                addReplayTableRowsFragment(replayStorageArray);
                
        });

    });

}

//MASTER REPLAY TABLE OPERATION - THIS ADDS BUTTON LISTENERS FOR THE MASTER TABLE SHOW, RUN AND DELETE OPERATIONS

function addReplayTableButtonListeners() {

    //delete replay button click handler
    $('.ui.replaysTable .showReplayLink').on('mousedown', function(){
        
        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr("data-replay-id");
        //the replay key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then(replay => {
                //close the run replay replayEvents table
                $('.ui.fluid.runReplay.container').css('display', 'none');
                //show the section that has the table in one tab and the code in another tab
                $('.ui.fluid.showReplay.container').css('display', 'block');
                //add the loading indicator to the table section
                $('.ui.fluid.showReplay.container .ui.bottom.attached.active.tab.segment ').addClass('loading');
                //update the checkboxes to have the current recording id                
                $('.ui.fluid.showReplay.container .ui.code.form .ui.radio.checkbox input[name="outputCodeType"]').attr('data-replay-id', replayKey);
                //then update the edit recording events table
                updateReplayEventsTableAndCodeText(replay);
                //then remove the loading indicator
                $('.ui.fluid.showReplay.container .ui.bottom.attached.active.tab.segment ').removeClass('loading');
            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));   

    });

    //run replay button click handler
    $('.ui.replaysTable .runReplayLink').on('mousedown', function(){
        
        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr("data-replay-id");
        //the replay key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then(replay => {
                //close the show replay replayEvents table
                $('.ui.fluid.showReplay.container').css('display', 'none');
                //show the section that has the table in one tab and the code in another tab
                $('.ui.fluid.runReplay.container').css('display', 'block');
                //empty the table body first
                $('.ui.runReplayReplayEventsTable.table tbody').empty();
                //get a reference to the table
                const table = document.querySelector('.ui.runReplayReplayEventsTable.table tbody')
                //then for each replayEvent we need to add it to the table and the textarea
                for (let replayEvent in replay.replayEventArray) { 
                    //then borrow the function from newReplay.js
                    addNewReplayEventToTable(replay, replay.replayEventArray[replayEvent], table);
                }
                //add listeners for the clicks in the show replay replay events table
                addRunReplayReplayEventsTableButtonListeners();
            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));   

    });

    //delete replay button click handler
    $('.ui.replaysTable .deleteReplayLink').on('mousedown', function(){
        
        //close the show replay replayEvents table
        $('.ui.fluid.showReplay.container').css('display', 'none');
        //close the run replay replayEvents table
        $('.ui.fluid.runReplay.container').css('display', 'none');
        //delete the test in the database, using data-test-id from the template
        const replayKey = $(this).attr("data-replay-id");
        //the test key will be in string format - StorageUtils handles conversion
        StorageUtils.deleteModelObjectInDatabaseTable('replays.js', replayKey, 'replays')
            //then we have nothing returned
            .then( () => {
                //then redraw the table
                updateReplaysTable();
            })
            //the delete single object function will reject if object is not in database
            .catch( () => console.error(`Error Deleting Replay ${recordingKey}`));

    });

}

//SLAVE SHOW REPLAY EVENTS TABLE OPERATION - THIS POPULATES THE SHOW EVENTS TABLE WITH ALL THE REPLAY EVENTS FROM THE SELECTED REPLAY
//THIS HAS A SEPARATE FUNCTION DUE TO THE COMPEXITIES OF THE CODE GENERATION - THE SLAVE RUN REPLAY POPULATION IS DONE INLINE IN THE BUTTON LISTENER

function updateReplayEventsTableAndCodeText(replay) {

    //empty the table body first
    $('.ui.showReplayReplayEventsTable.table tbody').empty();
    //get a reference to the table
    const table = document.querySelector('.ui.showReplayReplayEventsTable.table tbody')
    //then for each replayEvent we need to add it to the table and the textarea
    for (let replayEvent in replay.replayEventArray) { 
        //then borrow the function from newReplay.js
        addNewReplayEventToTable(replay, replay.replayEventArray[replayEvent], table);
    }
    //add listeners for the clicks in the show replay replay events table
    addShowReplayReplayEventsTableButtonListeners();

    //TO DO - CODE FOR JEST AND PUPPETEER

}

//SLAVE SHOW REPLAY EVENTS TABLE OPERATION - THIS ADDS BUTTON LISTENERS FOR SUBORDINATE SHOW REPLAY, REPLAY EVENTS TABLE

function addShowReplayReplayEventsTableButtonListeners() {

    $('.ui.showReplayReplayEventsTable.table .showReplayEventRow').on('mousedown', function(){

        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr("data-replay-id");
        //do the same with the replay event key
        const replayEventKey = $(this).attr("data-replay-event-id");
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then(replay => {
                //use either the replay or assertion id to get the replay event
                const replayEvent = replay.replayEventArray.find(event => event.replayEventId == replayEventKey || event.assertionId == replayEventKey);
                //then we only display events which have a status otherwise there's no information to show
                switch(true) {
                    //first we deal with the case where it is an assertion with a null event status value, indicating it has never been run
                    case replayEvent.assertionEventStatus == null || replayEvent.replayEventStatus == null:
                        //show the warning message
                        $('.ui.showReplayReplayEventsTable.table .noReplayInformationMessageRow').css('display', 'table-row');
                        break;
                    //otherwise we show the relevant information by default
                    default:

                    //TO DO - when we know what kind of event information we want to show in the table footer
                        
                }
            });

    });

    $('.ui.showReplayReplayEventsTable.table .deleteReplayEventRow').on('mousedown', function(){

        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr("data-replay-id");
        //do the same with the replay event key
        const replayEventKey = $(this).attr("data-replay-event-id");
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then(replay => {
                console.log(replay)
                //first we need to create a new replay, with our recording properties and replay properties
                const newReplay = new Replay(replay, replay);
                //then we need to filter the new replay's event table
                newReplay.replayEventArray = newReplay.replayEventArray
                    //get rid of the element that has been deleted, by reference to the replay event id or the aeertion id
                    .filter(item => item.replayEventId != replayEventKey && item.assertionId != replayEventKey)
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
            .then(newReplay => StorageUtils.updateModelObjectInDatabaseTable('replays.js', replayKey, newReplay, 'replays') )
            //then we need to retrieve the edited replay to update the table to reflect the deleted event
            .then( () => StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays') )
            //then we need to do the update to the table 
            .then(savedReplay => {
                //this is specific to the showReplayReplayEventsTable, also used on initial display
                updateReplayEventsTableAndCodeText(savedReplay);
            })  
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));      


    });

}

//SLAVE RUN REPLAY EVENTS TABLE OPERATION - THIS ADDS BUTTON LISTENERS FOR SUBORDINATE RUN REPLAY, REPLAY EVENTS TABLE

function addRunReplayReplayEventsTableButtonListeners() {

    $('.ui.runReplayReplayEventsTable.table .showReplayEventRow').on('mousedown', function(){

        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr("data-replay-id");
        //do the same with the replay event key
        const replayEventKey = $(this).attr("data-replay-event-id");
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then(replay => {
                //use either the replay or assertion id to get the replay event
                const replayEvent = replay.replayEventArray.find(event => event.replayEventId == replayEventKey || event.assertionId == replayEventKey);
                //then we only display events which have a status otherwise there's no information to show
                switch(true) {
                    //first we deal with the case where it is an assertion with a null event status value, indicating it has never been run
                    case replayEvent.assertionEventStatus == null || replayEvent.replayEventStatus == null:
                        //show the warning message
                        $('.ui.runReplayReplayEventsTable.table .noReplayInformationMessageRow').css('display', 'table-row');
                        break;
                    //otherwise we show the relevant information by default
                    default:

                    //TO DO - when we know what kind of event information we want to show in the table footer
                        
                }
            });

    });

    $('.ui.runReplayReplayEventsTable.table .deleteReplayEventRow').on('mousedown', function(){

        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr("data-replay-id");
        //do the same with the replay event key
        const replayEventKey = $(this).attr("data-replay-event-id");
        //the recording key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then(replay => {
                console.log(replay)
                //first we need to create a new replay, with our recording properties and replay properties
                const newReplay = new Replay(replay, replay);
                //then we need to filter the new replay's event table
                newReplay.replayEventArray = newReplay.replayEventArray
                    //get rid of the element that has been deleted, by reference to the replay event id or the aeertion id
                    .filter(item => item.replayEventId != replayEventKey && item.assertionId != replayEventKey)
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
            .then(newReplay => StorageUtils.updateModelObjectInDatabaseTable('replays.js', replayKey, newReplay, 'replays') )
            //then we need to retrieve the edited replay to update the table to reflect the deleted event
            .then( () => StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays') )
            //then we need to do the update to the table 
            .then(savedReplay => {
                //empty the table body first
                $('.ui.runReplayReplayEventsTable.table tbody').empty();
                //get a reference to the table
                const table = document.querySelector('.ui.runReplayReplayEventsTable.table tbody')
                //then for each replayEvent we need to add it to the table and the textarea
                for (let replayEvent in savedReplay.replayEventArray) { 
                    //then borrow the function from newReplay.js
                    addNewReplayEventToTable(savedReplay, savedReplay.replayEventArray[replayEvent], table);
                }
            })  
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));      


    });

}


$(document).ready (function(){

    //activate the tab control
    $('.ui.top.attached.replay.tabular.menu .item').tab({
        //we need to rehide stuff as tabs are shown
        'onVisible': function(tab) {
            switch (tab) {
                case 'code':
                    
                    break;
                case 'events':
                    //hide the warning message about events with no information by default
                    $('.ui.showReplayReplayEventsTable.table .noReplayInformationMessageRow').css('display', 'none');
            }
        }
    });

});