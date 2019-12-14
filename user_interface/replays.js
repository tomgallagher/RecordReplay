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
        //this makes a copy of the replay WITH THE RIGHT RECORDING PARAMETERS to access the formatting functions
        replayExecutedNode.textContent = new Replay(replayStorageArray[replay], replayStorageArray[replay]).printExecutionTime();
        //<td data-label="replayStatus"></td>
        let replayStatusNode = tempNode.querySelector('td[data-label="replayStatus"]');
        //this makes a copy of the replay WITH THE RIGHT RECORDING PARAMETERS to access the formatting functions
        replayStatusNode.textContent = new Replay(replayStorageArray[replay], replayStorageArray[replay]).printStatus();

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

    $('.ui.replaysTable .ui.pagination.menu .item').on('click', function(){

        //get the current page displayed, set to zero by default
        var currentPage = Number($('.ui.replaysTable .ui.pagination.menu').attr('data-current-page'));
        //get the classes of the active item as a list
        const classArray = $(this).attr('class').split(/\s+/);
        //then get all the current replays from the database, as an array
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

    console.log("adding replay table button listeners");
    //delete replay button click handler
    $('.ui.replaysTable .showReplayLink').on('click', function(){
        
        console.log("Firing Show Replay Link");
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
                //make sure we always have replay events showing
                $('.ui.fluid.showReplay.container .ui.top.attached.replay.tabular.menu .item[data-tab="replayEvents"]').click();
                //hide the form that shows the detail of the replay event
                $('.viewDetailedTableReplayEventsFooter').css('display', 'none');
                //add the loading indicator to the table section
                $('.ui.fluid.showReplay.container .ui.bottom.attached.active.tab.segment ').addClass('loading');
                //update the checkboxes to have the current replay id                
                $('.ui.fluid.showReplay.container .ui.code.form .ui.radio.checkbox input[name="outputCodeType"]').attr('data-replay-id', replayKey);
                //then update the edit replay events table
                uodateReplayEventsTableCodeReports(replay);
                //then remove the loading indicator
                $('.ui.fluid.showReplay.container .ui.bottom.attached.active.tab.segment ').removeClass('loading');
            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));   

    });

    //run replay button click handler
    $('.ui.replaysTable .runReplayLink').on('click', function(){
        
        console.log("Firing Run Replay Link");
        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr("data-replay-id");
        //the replay key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then(replay => {
                //close the show replay replayEvents table
                $('.ui.fluid.showReplay.container').css('display', 'none');
                //show the run replay section 
                $('.ui.fluid.runReplay.container').css('display', 'block');
                //update the buttons to contain the replay id
                $('.ui.fluid.runReplay.container .ui.positive.button').attr('data-replay-id', replayKey);
                $('.ui.fluid.runReplay.container .ui.negative.button').attr('data-replay-id', replayKey);
                //show the start button as enabled
                $('.ui.runReplay.container .ui.startReplay.positive.button').removeClass('disabled');
                //hide the information message about being unable to show events that have not been run at least once
                $('.ui.runReplayReplayEventsTable.table .informationMessageRow').hide();
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
    $('.ui.replaysTable .deleteReplayLink').on('dblclick', function(){
        
        console.log("Firing Delete Replay Link");
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
                //then run the function that enables the buttons
                enableVerticalMenuButtonsWhenDataAllows();
            })
            //the delete single object function will reject if object is not in database
            .catch( () => console.error(`Error Deleting Replay ${replayKey}`));

    });

}

//SLAVE SHOW REPLAY EVENTS TABLE OPERATION - THIS POPULATES THE SHOW EVENTS TABLE WITH ALL THE REPLAY EVENTS FROM THE SELECTED REPLAY
//THIS HAS A SEPARATE FUNCTION DUE TO THE COMPEXITIES OF THE CODE GENERATION - THE SLAVE RUN REPLAY POPULATION IS DONE INLINE IN THE BUTTON LISTENER

function uodateReplayEventsTableCodeReports(replay) {

    console.log(replay);
    //empty the table body first
    $('.ui.showReplayReplayEventsTable.table tbody').empty();
    //hide the error cards 
    $('.ui.four.errorEvent.stackable.cards').hide();
    //and the positive placeholder 
    $('.ui.execution.positive.placeholder.segment').hide();
    
    //get a reference to the table
    const table = document.querySelector('.ui.showReplayReplayEventsTable.table tbody')
    //then for each replayEvent we need to add it to the table and the textarea
    for (let replayEvent in replay.replayEventArray) { 
        //then borrow the function from newReplay.js
        addNewReplayEventToTable(replay, replay.replayEventArray[replayEvent], table);
    }
    //then for the show table we don't show the replayed column - it only has meaning in the run events context
    $('.ui.showReplayReplayEventsTable.table td[data-label="replay_timestamp_executed"]').css('display', 'none');
    //add listeners for the clicks in the show replay replay events table
    addShowReplayReplayEventsTableButtonListeners();

    //TO DO - CODE FOR JEST AND PUPPETEER



    //make sure the code text area is the same height as the table, to indicate the number of events
    $('.ui.fluid.showReplay.container .codeOutputTextArea').css("max-height", "none");
    $('.ui.fluid.showReplay.container .codeOutputTextArea').height($('.ui.fluid.showReplay.container .showReplayReplayEventsTable ').height());

    //report execution history
    if (replay.mutatedReplayEventArray && replay.mutatedReplayEventArray.length > 0) {

        //first we need to see if we have any failures in the most recent replay history
        const failedReplayEventArray = replay.mutatedReplayEventArray.filter(item => item.replayEventStatus == false || item.assertionEventStatus == false);
        //then, if we do, we need to deliver some fail cards
        if (failedReplayEventArray.length > 0) {

            //we need a map to give a visual representation of the actions
            const actionToIconMap = {
                Page : "fab fa-chrome fa-5x",
                Mouse : "fas fa-mouse fa-5x",
                Assertion : "fas fa-equals fa-5x",
                Scroll : "fas fa-arrows-alt-v fa-5x",
                Keyboard : "far fa-keyboard fa-5x",
                Input : "far fa-user fa-5x",
                TextSelect : "fas fa-highlighter fa-5x",
            };
            //hide the placeholder
            $('.ui.history.placeholder.segment').hide();
            //hide the positive placeholder
            $('.ui.execution.positive.placeholder.segment').hide();
            //on multiple iterations, empty the error card so we can add the updated information
            $('.ui.four.errorEvent.stackable.cards').empty();
            //target our error event card template first, we only need to find the template once
            let targetNode = document.querySelector('.failedEventCardTemplate');
            //we need to do more work as we have to save the template in a table, which we don't need, we just want the row
            let targetCard = targetNode.querySelector('.ui.red.raised.card');
            //then create a document fragment that we will use as a container for each looped template
            let docFrag = document.createDocumentFragment();

            //then we loop through the error events and add in the information
            for (let errorEvent in failedReplayEventArray) { 
                
                //then we make a clone of the card, that will serve the purpose
                let tempCard = targetCard.cloneNode(true);
                //<div class="right floated meta timeFailed">14h</div>
                let failTimeNode = tempCard.querySelector('.timeFailed');
                let failTime = failedReplayEventArray[errorEvent].assertionEventReplayed || failedReplayEventArray[errorEvent].assertionEventReplayed;
                failTimeNode.textContent = new Date(failTime).toLocaleString();
                //<i class="recordingOrAssertionEventActionIcon" style="color:#6435c9"></i> 
                let iconNode = tempCard.querySelector('.recordingOrAssertionEventActionIcon');
                let iconAction = failedReplayEventArray[errorEvent].assertionEventAction || failedReplayEventArray[errorEvent].recordingEventAction;
                //then split the font awesome class by space as we can't add multiple classes
                actionToIconMap[iconAction].split(' ').forEach(item => iconNode.classList.add(item));
                //<div class="recordingOrAssertionEventAction header"></div>
                let actionNode = tempCard.querySelector('.recordingOrAssertionEventAction');
                actionNode.textContent = failedReplayEventArray[errorEvent].assertionEventAction || failedReplayEventArray[errorEvent].recordingEventAction;
                //<span class="recordingOrAssertionEventType"></span>
                let typeNode = tempCard.querySelector('.recordingOrAssertionEventType');
                typeNode.textContent = failedReplayEventArray[errorEvent].assertionType || failedReplayEventArray[errorEvent].recordingEventActionType;
                //<span class="joinedReplayOrAssertionErrorMessages"></span>
                let messagesNode = tempCard.querySelector('.recordingOrAssertionEventType');
                let messagesArray = failedReplayEventArray[errorEvent].replayErrorMessages || failedReplayEventArray[errorEvent].assertionErrorMessages;
                messagesNode.textContent = messagesArray.join(', ');
                //<div class="targetElement description"></div>
                let elementNode = tempCard.querySelector('.targetElement');
                elementNode.textContent = failedReplayEventArray[errorEvent].recordingEventHTMLTag;
                //then append the card to the document fragment
                docFrag.appendChild(tempCard);

            }

            //once we have finished 
            let failureCards = document.querySelector('.ui.four.errorEvent.stackable.cards');
            //then we append the fragment to the table
            failureCards.appendChild(docFrag);
            //then show the cards
            $('.ui.four.errorEvent.stackable.cards').show();
           
        } else {

            //hide the placeholder
            $('.ui.history.placeholder.segment').hide();
            //hide the error cards 
            $('.ui.four.errorEvent.stackable.cards').hide();
            //show the positive placeholder 
            $('.ui.execution.positive.placeholder.segment').show();
            
        }

    }

    //report performance timings
    if (replay.replayPerformanceTimings && Object.keys(replay.replayPerformanceTimings).length > 0) {

        let targetNode = document.querySelector('.performanceTimingsTemplate');
        //we need to do more work as we have to save the template in a table, which we don't need, we just want the row
        let targetSteps = targetNode.querySelector('.ui.three.steps');
        //make the clone
        let tempNode = targetSteps.cloneNode(true);
        //adjust the clone
        tempNode.querySelector('.onCommittedTime.description').text(new Date(replay.replayPerformanceTimings.onCommitted).toLocaleString());
        //TO DO then relative times for the other two
        tempNode.querySelector('.onDomLoadedTime.description').text(new Date(replay.replayPerformanceTimings.onDOMContentLoaded).toLocaleString());
        tempNode.querySelector('.onCompleteTime.description').text(new Date(replay.replayPerformanceTimings.onCompleted).toLocaleString());
        //hide the placeholder
        $('.ui.performance.placeholder.segment').hide();
        //remove any existing steps from earlier iterations
        $('.ui.basic.performance.segment').remove('.ui.three.steps');
        //then add the performance steps
        $('.ui.basic.performance.segment').append(tempNode);
        
    } else {

        //show the placeholder
        $('.ui.performance.placeholder.segment').show();
        //then remove any performance steps
        $('.ui.basic.performance.segment').remove('.ui.three.steps');

    }
    
    //report resource loads using replay.replayResourceLoads object
    if (replay.replayResourceLoads && Object.keys(replay.replayResourceLoads).length > 0) {

        //then we need to create the data for the chart from the replay resource loads object
        //labels from the object keys
        const chartLabels = Object.keys(replay.replayResourceLoads);
        //data from the object values
        const chartData = Object.values(replay.replayResourceLoads);
        //then the colour variables
        let chartColours = ["red", "orange", "purple", "yellow", "green", "blue", "grey"].slice(chartLabels.length - 1); 
        let chartBackgroundColour = 'white';
        //then get theme setting
        const inverted = localStorage.getItem("ThemeInverted");
        //if inverted we need to change the chart background colour to black
        inverted == "true" ? chartBackgroundColour = 'black' : null;
        //set up the chart config
        var chartConfig = { 
            //doughnut chart
            type: 'doughnut',
            //one dataset for the chart, with matched length arrays of chart data, chart colours and labels, as well as a label for the one data set  
            data: { datasets: [ { data: chartData, backgroundColor: chartColours, label: 'Resource Loads'} ], labels: chartLabels }, 
            //and chart options
			options: { responsive: true }
        };
        //hide the placeholder
        $('.ui.performance.placeholder.segment').hide();
        //remove any existing charts from earlier iterations
        $('.ui.basic.performance.segment').remove('.resourceLoadsChart');
        //add the canvas 
        $('.ui.basic.performance.segment').append(`<canvas class="resourceLoadsChart" style="display: block; background-color: ${chartBackgroundColour}"></canvas>`);
        //get the canvas context
        var ctx = document.querySelector('.resourceLoadsChart').getContext('2d');
        //draw the chart
        new Chart(ctx, chartConfig);

    } else {

        //show the placeholder
        $('.ui.performance.placeholder.segment').show();
        //then remove any charts
        $('.ui.basic.performance.segment').remove('.resourceLoadsChart');

    }

    //TO DO - UPDATE THE REPORTS SECTION USING THE TEMPLATES
    //report screenshot with replay.replayScreenShot string of Base64-encoded image data

}

//SLAVE SHOW REPLAY EVENTS TABLE OPERATION - THIS ADDS BUTTON LISTENERS FOR SUBORDINATE SHOW REPLAY, REPLAY EVENTS TABLE

function addShowReplayReplayEventsTableButtonListeners() {

    $('.ui.showReplayReplayEventsTable.table .showReplayEventRow').on('click', function(){

        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr("data-replay-id");
        //do the same with the replay event key
        const replayEventKey = $(this).attr("data-replay-event-id");
        //the replay key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then(replay => {
                //use either the replay or assertion id to get the replay event
                const replayEvent = replay.replayEventArray.find(event => event.replayEventId == replayEventKey || event.assertionId == replayEventKey);
                //fill the form fields with the data from the replay event
                $('.ui.viewReplayEvent.form input[name=replay_recordingEventCssSelectorPath]').val(replayEvent.recordingEventCssSelectorPath);
                $('.ui.viewReplayEvent.form input[name=replay_recordingEventCssDomPath]').val(replayEvent.recordingEventCssDomPath);
                $('.ui.viewReplayEvent.form input[name=replay_recordingEventCssSimmerPath]').val(replayEvent.recordingEventCssSimmerPath);
                $('.ui.viewReplayEvent.form input[name=replay_recordingEventXPath]').val(replayEvent.recordingEventXPath);
                $('.ui.viewReplayEvent.form input[name=replay_recordingEventLocation]').val(replayEvent.recordingEventLocationHref);
                //then the checkbox
                replayEvent.recordingEventIsIframe == true ? $('.ui.viewReplayEvent .ui.checkbox input[name=replay_recordingEventIsIframe]').prop('checked', true) : $('.ui.viewReplayEvent .ui.checkbox input[name=replay_recordingEventIsIframe]').prop('checked', false);
                //show the form 
                $('.viewDetailedTableReplayEventsFooter').css("display", "table-row");
            })
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));   

    });

    $('.ui.showReplayReplayEventsTable.table .deleteReplayEventRow').on('click', function(){

        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr("data-replay-id");
        //do the same with the replay event key
        const replayEventKey = $(this).attr("data-replay-event-id");
        //the replay key will be in string format - StorageUtils handles conversion
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
                uodateReplayEventsTableCodeReports(savedReplay);
            })  
            //the get single object function will reject if object is not in database
            .catch(error => console.error(error));      


    });

}

//SLAVE RUN REPLAY EVENTS TABLE OPERATION - THIS ADDS BUTTON LISTENERS FOR SUBORDINATE RUN REPLAY, REPLAY EVENTS TABLE

function addRunReplayReplayEventsTableButtonListeners() {

    $('.ui.runReplayReplayEventsTable.table .showReplayEventRow').on('click', function(){

        console.log("Firing Run Replay Table Row Show Link");
        //here we deal with messages that are appended to the html as the replay is running
        //we have log messages for all replay events
        const logMessages = JSON.parse($(this).attr("data-log-messages"));
        //we will have error messages for some replay events 
        const errorMessages = JSON.parse($(this).attr("data-error-messages"));
        //show the information row
        $('.ui.runReplayReplayEventsTable.table .informationMessageRow').css('display', 'table-row');
        //then what we show depends on the content of the messages
        switch(true) {
            //then if it's empty then we have no messages because the event has been run
            case logMessages.length == 0 && errorMessages.length == 0:
                //show the warning message
                $('.ui.runReplayReplayEventsTable.table .ui.warning.noDetails.message').css('display', 'block');
                break;
            case logMessages.length > 0 && errorMessages.length == 0:
                //empty the lists
                $('.ui.runReplayReplayEventsTable.table .logging.list').empty();
                $('.ui.runReplayReplayEventsTable.table .error.list').empty();
                //hide the error section
                $('.ui.runReplayReplayEventsTable.table .ui.negative.error.message').css('display', 'none');
                //loop through the log messages
                for (let item in logMessages) {
                    //attach the logging messages to the message list
                    $('.ui.runReplayReplayEventsTable.table .logging.list').append(`<li>${logMessages[item]}</li>`);
                }
                //show the logging message
                $('.ui.runReplayReplayEventsTable.table .ui.info.logging.message').css('display', 'block');
                break;
            case errorMessages.length > 0:
                //empty the lists
                $('.ui.runReplayReplayEventsTable.table .logging.list').empty();
                $('.ui.runReplayReplayEventsTable.table .error.list').empty();
                //loop through the log messages
                for (let item in logMessages) {
                    //attach the logging messages to the message list
                    $('.ui.runReplayReplayEventsTable.table .logging.list').append(`<li>${logMessages[item]}</li>`);
                }
                //loop through the error messages
                for (let item in errorMessages) {
                    //attach the error messages to the message list
                    $('.ui.runReplayReplayEventsTable.table .error.list').append(`<li>${errorMessages[item]}</li>`);
                }
                //show the logging message
                $('.ui.runReplayReplayEventsTable.table .ui.info.logging.message').css('display', 'block');
                //show the error message
                $('.ui.runReplayReplayEventsTable.table .ui.negative.error.message').css('display', 'block');
        }

    });

    $('.ui.runReplayReplayEventsTable.table .deleteReplayEventRow').on('click', function(){

        console.log("Firing Run Replay Table Row Delete Link");
        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr("data-replay-id");
        //do the same with the replay event key
        const replayEventKey = $(this).attr("data-replay-event-id");
        //the replay key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then(replay => {
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

//MAIN FUNCTION BUTTONS FOR RUNNING THE REPLAY

function addStartReplayHandler() {

    //REPLAYING EVENTS START HANDLER
    Rx.Observable.fromEvent(document.querySelector('.ui.runReplay.container .ui.startReplay.positive.button'), 'click')
        //we only need to take one of these clicks at a time, the listener is refreshed on completion
        .take(1)
        //make the changes to the ui to indicate that we have started
        .do(event => {
            //show the start replay button as disabled
            event.target.className += " disabled";
            //show the stop replay button as enabled
            $('.ui.runReplay.container .ui.stopReplay.negative.button').removeClass('disabled');
            //remove all the indicators from the table rows, apart from disabled and assertion rwo
            $(`.ui.runReplayReplayEventsTable.table tr`).removeClass('positive');
            $(`.ui.runReplayReplayEventsTable.table tr`).removeClass('negative');
            //show the replay loader
            $('.ui.runReplay.container .ui.text.small.replay.loader').addClass('active');  
            //and hide the 'replay has not run' message if it's showing
            $('.ui.warning.noDetails.message').css('display', 'none');
            //and the various logging messages
            $('.ui.runReplayReplayEventsTable.table .ui.info.logging.message').css('display', 'none');
            $('.ui.runReplayReplayEventsTable.table .ui.negative.error.message').css('display', 'none');
        })
        //get the replay from storage using the data id from the button
        .switchMap(event => Rx.Observable.fromPromise(StorageUtils.getSingleObjectFromDatabaseTable('replays.js', event.target.getAttribute('data-replay-id') , 'replays')))
        //send the message to the background script to start the replay processes
        .do(replay => new RecordReplayMessenger({}).sendMessage({newReplay: replay}))
        //we want to keep track of how the replay performs without making changes to the replay itself - so we add the mutated replay event array
        .map(replay => Object.assign({}, replay, { mutatedReplayEventArray: [] }) )
        //then switch map into an observable of the replays events, adding the replay id
        .switchMap(replay => 
            //we want a simple observable from the replay event array, each item has all that we need to instruct the event replayer
            Rx.Observable.from(replay.replayEventArray)
                //then we need to make sure that the events happen in the same time frame as the recording
                .concatMap(replayEvent => Rx.Observable.of(replayEvent).delay(replayEvent.recordingTimeSincePrevious))

                //THIS IS WHERE THE EVENT MUST BE EXECUTED, CONFIRMED AND MUTATED
                //WE MUST DO THIS WITH A CHROME MESSAGE sendMessageGetResponse AND A TIMER FOR FAILS
                //THE MESSAGES GO OUT TO ALL FRAMES IN THE PAGE, AS WELL AS THE BACKGROUND TAB RUNNER (FOR KEYBOARD AND NAVIGATION)
                //NAVIGATION EVENTS WILL REQUIRE A DIFFERENT FAIL TIMER - OTHERWISE RESPONSE, IF ANY, SHOULD BE VIRTUALLY INSTANTANEOUS
                
                //various mutations of the replay event have to occur here
                //so the message response.replayExecution.replayEventReplayed needs to be mapped to the replayEvent.replayEventReplayed
                //so the message response.replayExecution.replayEventStatus needs to be mapped to replayEvent.replayEventStatus
                //so the message response.replayExecution.replayLogMessages needs to be mapped to replayEvent.replayLogMessages
                //so the message response.replayExecution.replayErrorMessages needs to be mapped to replayEvent.replayErrorMessages
                
                //various mutations of the replay assertion event have to occur here
                //so the message response.replayExecution.replayEventReplayed needs to be mapped to the assertionEvent.assertionEventReplayed
                //so the message response.replayExecution.replayEventStatus needs to be mapped to assertionEvent.assertionEventStatus
                //so the message response.replayExecution.replayLogMessages needs to be mapped to assertionEvent.assertionLogMessages
                //so the message response.replayExecution.replayErrorMessages needs to be mapped to assertionEvent.assertionErrorMessages

                //then we need to do slightly more complicated work to calculate the replayTimeSincePrevious
                //then we need to do slightly more complicated work to calculate the assertionTimeSincePrevious

                //FOR TESTING UI ONLY
                .map(replayEvent => {
                    //we need to do different artificual work for the two types of replay events
                    if (replayEvent.assertionId) {

                        return Object.assign(
                            {}, 
                            replayEvent,
                            {
                                assertionEventReplayed: Date.now(),
                                assertionEventStatus: false,
                                assertionLogMessages: ["Page Activated", "Element Located"],
                                assertionErrorMessages: ["Element Attribute Not Present", "Element Attribute Content Unmatched"],
                                assertionTimeSincePrevious: replayEvent.recordingTimeSincePrevious,
                                assertionChosenSelectorString: "SomeChosenSelector"
                            }
                        );

                    } else {

                        return Object.assign(
                            {}, 
                            replayEvent,
                            {
                                replayEventReplayed: Date.now(),
                                replayEventStatus: true,
                                replayLogMessages: ["Page Activated", "Element Located", "Event Replayed"],
                                replayErrorMessages: [],
                                replayTimeSincePrevious: replayEvent.recordingTimeSincePrevious,
                                replayChosenSelectorString: "SomeChosenSelector"
                            }
                        );

                    }
                })

                //then we need to update the user interface
                .do(replayEvent => {
                    //we need to work out if we are working with replay or assertion id
                    const targetId = replayEvent.assertionId || replayEvent.replayEventId;
                    //find the row in the table that corresponds with the replay event id or the assertionid
                    const $targetTableRow = $(`.ui.runReplayReplayEventsTable.table tr[data-replay-event-id='${targetId}']`);
                    //we need to work out if we are dealing with replay or assertion success / failure
                    const status = replayEvent.assertionEventStatus || replayEvent.replayEventStatus;
                    //then add the class to indicate success or failure
                    status == true ? $targetTableRow.addClass('positive'): $targetTableRow.addClass('negative');
                    //then we need to work out if we are working with replay or assertion time since previous
                    const timeSincePrevious = replayEvent.assertionTimeSincePrevious || replayEvent.replayTimeSincePrevious;
                    //then we need to work out if we are working with replay or assertion eventReplayed
                    const timeReplayed = replayEvent.assertionEventReplayed || replayEvent.replayEventReplayed;
                    //then do some work to create a nice looking time since previous
                    const timeSincePreviousString = (timeSincePrevious == 0 ? new Date(timeReplayed).toLocaleString() : `+ ${Math.ceil(timeSincePrevious / 1000)} sec`);
                    //then we need to add this to the relevant table row
                    $targetTableRow.children('td[data-label="replay_timestamp_executed"]').text(timeSincePreviousString);
                    //finally we need to work the messages
                    const logMessages = replayEvent.assertionLogMessages || replayEvent.replayLogMessages;
                    //add the stringified logmessages array to the show link
                    $targetTableRow.find('.showReplayEventRow').attr('data-log-messages', JSON.stringify(logMessages)); 
                    const errorMessages = replayEvent.assertionErrorMessages || replayEvent.replayErrorMessages;
                    //add the stringified logmessages array to the show link
                    $targetTableRow.find('.showReplayEventRow').attr('data-error-messages', JSON.stringify(errorMessages)); 
                }),
            //then use the projection function to tie the two together
            (replay, mutatedReplayEvent) => {
                //then we need to update the array
                replay.mutatedReplayEventArray.push(mutatedReplayEvent);
                //then return the replay so it can be updated in the database
                return replay;
            }
        )
        //we only want to continue to process replay events until the user interface stop replay button is clicked 
        .takeUntil(
            //merge the two sources of potential recording stop commands, either will do
            Rx.Observable.merge(
                //obviously the stop button is a source of finalisation
                Rx.Observable.fromEvent(document.querySelector('.ui.runReplay.container .ui.stopReplay.negative.button'), 'click')
                    //we need to send the message to the background script here 
                    .do(event => new RecordReplayMessenger({}).sendMessage({stopReplay: event.target.getAttribute('data-replay-id')})),
                //less obviously, the user might choose to stop the replay by closing the tab window
                //background scripts keep an eye on this and will send a message entitled replayTabClosed
                new RecordReplayMessenger({}).isAsync(false).chromeOnMessageObservable
                    //we only want to receive replayTabClosed events here
                    .filter(msgObject => msgObject.request.hasOwnProperty('replayTabClosed'))
                    //send the response so we don't get the silly errors
                    .do(msgObject => msgObject.sendResponse({message: `User Interface Received Tab Closed Event`}) )
            )
        )
        .subscribe(
            mutatedReplay => {
                //we need to know the progress of the test, which we can assess by seeing how many events have been pushed to the mutated events array
                const numberMutated = mutatedReplay.mutatedReplayEventArray.length;
                console.log(`${numberMutated} Replay Events Tested`);
                //we need to know how many of the replays have failed. which we can do by filtering for false - unperformed replays have a value of null
                const numberFailed = mutatedReplay.mutatedReplayEventArray.filter(event => event.assertionEventStatus == false || event.replayEventStatus == false).length;
                console.log(`${numberFailed} Replay Events Failed`);
                //we need to know how many tests have passed, which we get from the positives
                const numberPassed = mutatedReplay.mutatedReplayEventArray.filter(event => event.assertionEventStatus == true || event.replayEventStatus == true).length;
                console.log(`${numberPassed} Replay Events Passed`);
                //then if the number of events mutated equals the length of the original replayEventsArray we have finished
                if (numberMutated == mutatedReplay.replayEventArray.length) {
                    console.log("Replay Complete")
                    //then we have to update the replay with the time that this replay was performed
                    mutatedReplay.replayExecuted = Date.now();
                    //then we add the replay status
                    mutatedReplay.replayStatus = (numberMutated == numberPassed ? true : false);
                    //then we add the fail time if required, otherwise set it to zero
                    numberMutated != numberPassed ? mutatedReplay.replayFailTime = Date.now() : mutatedReplay.replayFailTime = 0;
                    //report the final status of the replay
                    console.log(mutatedReplay);
                    //then we need to save the updated replay to the database
                    StorageUtils.updateModelObjectInDatabaseTable('replays.js', mutatedReplay.id, mutatedReplay, 'replays')
                        .then( () => {
                            //and update the master replays table at the top to reflect executed time and status
                            updateReplaysTable();
                        });
                }
            },
            error => console.error(error),
            () => {
                //hide the recording loader
                $('.ui.text.small.replay.loader').removeClass('active');
                //show the start button as enabled
                $('.ui.runReplay.container .ui.startReplay.positive.button').removeClass('disabled');
                //show the stop replay button as disabled
                $('.ui.runReplay.container .ui.stopReplay.negative.button').addClass('disabled');
                //then we need to add the start recording handler again
                addStartReplayHandler();
            }
        )


}

$(document).ready (function(){

    //add the listener for the run replay button
    addStartReplayHandler();
    //activate the tab control
    $('.ui.showReplay.container .ui.top.attached.replay.tabular.menu .item').tab({
        //we need to rehide stuff as tabs are shown
        'onVisible': function(tab) {
            switch (tab) {
                case 'replayEvents':
                    //hide the warning message about events with no information by default
                    $('.ui.showReplayReplayEventsTable.table .informationMessageRow').css('display', 'none');
                    break;
                case 'replayCode':
                    //init the checkbox, with Javascript checked as default
                    $('.ui.showReplay.container .ui.radio.checkbox input[value="jest+puppeteer"]').prop('checked', true);
                    break;
                case 'replayReports':
                
            }
        }
    });

    //activate the copy to clipboard button
    $('.ui.fluid.showReplay.container .ui.copyCodeToClipBoard.icon.button').on('click', function() {
        //get the text from the text area
        const textToCopy = $('.ui.showReplay.container .codeOutputTextArea').val();
        //then paste that into the clipboard
        navigator.clipboard.writeText(textToCopy);
    });

    //activate the download code as js file button
    $('.ui.showReplay.container .ui.downloadCodeToFile.submit.button').on('click', function(event) {
        //make sure the submit button does not perform its usual reload function
        event.preventDefault();
        //get the text from the text area
        const textToCopy = $('.ui.showReplay.container .codeOutputTextArea').val();
        //create a blob from the text - maybe set this to "text/plain" when we no longer want to use vscode to check formatting of emitted code
        var blob = new Blob([textToCopy], {type: "text/javascript"});
        //create a local temporary url - the object URL can be used as download URL
        var url = URL.createObjectURL(blob);
        //then download
        chrome.downloads.download({
            url: url,
            filename: "RecordReplay.js"
        });
    });

});