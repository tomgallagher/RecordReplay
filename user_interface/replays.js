//MASTER REPLAY TABLE POPULATION - THIS SHOWS ALL THE REPLAYS, PAGINATES THE REPLAYS AND ADDS THE TABLE ROWS VIA FUNCTION

function updateReplaysTable() {
    //first get all the current replays from the database, as an array, then loop through the array to update the UI
    StorageUtils.getAllObjectsInDatabaseTable('replays.js', 'replays')
        //once we have the array then we can start populating the table by looping through the array
        .then((replayStorageArray) => {
            //filter tests for default project by fetching from local storage
            const defaultProjectId = Number(localStorage.getItem('DefaultProject'));
            //if we have any number greater than zero, which indicates no default, then filter
            defaultProjectId > 0
                ? (replayStorageArray = replayStorageArray.filter(
                      (replay) => replay.recordingProjectId == defaultProjectId
                  ))
                : null;

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
                $('.ui.replaysTable .paginationMenuRow').css('display', 'table-row');
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

    //use for-of loop for easier reading
    for (let replay of replayStorageArray) {
        //then we make a clone of the row, that will serve the purpose
        let tempNode = targetRow.cloneNode(true);
        //<td data-label="replayName"></td>
        let replayNameNode = tempNode.querySelector('td[data-label="replayName"]');
        replayNameNode.textContent = replay.replayName;
        //<td data-label="replay_recordingProjectName"></td>
        let replayProjectNameNode = tempNode.querySelector('td[data-label="replay_recordingProjectName"]');
        replayProjectNameNode.textContent = replay.recordingProjectName;
        //<td data-label="replay_recordingTestName"></td>
        let replayTestNameNode = tempNode.querySelector('td[data-label="replay_recordingTestName"]');
        replayTestNameNode.textContent = replay.recordingTestName;
        //<td data-label="replayRecordingStartUrl" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;"></td>
        let replayStartUrlNode = tempNode.querySelector('td[data-label="replayRecordingStartUrl"]');
        replayStartUrlNode.textContent = replay.replayRecordingStartUrl;
        //any text-overflow elements should have a title with the whole string
        replayStartUrlNode.title = replay.replayRecordingStartUrl;
        //<td data-label="replayAssertionsCount"></td>
        let replayAssertionsLengthNode = tempNode.querySelector('td[data-label="replayAssertionsCount"]');
        replayAssertionsLengthNode.textContent = replay.replayEventArray.filter((item) =>
            item.hasOwnProperty('assertionId')
        ).length;
        //<td data-label="replayCreated"></td>
        let replayCreatedNode = tempNode.querySelector('td[data-label="replayCreated"]');
        replayCreatedNode.textContent = new Date(replay.replayCreated).toLocaleDateString();
        //<td data-label="replayExecuted"></td>
        let replayExecutedNode = tempNode.querySelector('td[data-label="replayExecuted"]');
        //this makes a copy of the replay WITH THE RIGHT RECORDING PARAMETERS to access the formatting functions
        replayExecutedNode.textContent = new Replay(replay, replay).printExecutionTime();
        //<td data-label="replayStatus"></td>
        let replayStatusNode = tempNode.querySelector('td[data-label="replayStatus"]');
        //this makes a copy of the replay WITH THE RIGHT RECORDING PARAMETERS to access the formatting functions
        replayStatusNode.textContent = new Replay(replay, replay).printStatus();

        let replayShowLink = tempNode.querySelector('.showReplayLink');
        replayShowLink.setAttribute('data-replay-id', `${replay.id}`);
        let replayEditLink = tempNode.querySelector('.runReplayLink');
        replayEditLink.setAttribute('data-replay-id', `${replay.id}`);
        let replayDeleteLink = tempNode.querySelector('.deleteReplayLink');
        replayDeleteLink.setAttribute('data-replay-id', `${replay.id}`);
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
    $('.ui.replaysTable .ui.pagination.menu .item').on('click', function () {
        //get the current page displayed, set to zero by default
        var currentPage = Number($('.ui.replaysTable .ui.pagination.menu').attr('data-current-page'));
        //get the classes of the active item as a list
        const classArray = $(this).attr('class').split(/\s+/);
        //then get all the current replays from the database, as an array
        StorageUtils.getAllObjectsInDatabaseTable('replays.js', 'replays')
            //once we have the array then we can start populating the table by looping through the array
            .then((replayStorageArray) => {
                //filter tests for default project by fetching from local storage
                const defaultProjectId = Number(localStorage.getItem('DefaultProject'));
                //if we have any number greater than zero, which indicates no default, then filter
                defaultProjectId > 0
                    ? (replayStorageArray = replayStorageArray.filter(
                          (replay) => replay.recordingProjectId == defaultProjectId
                      ))
                    : null;

                //then we paginate here using the class
                const paginator = new Pagination(replayStorageArray);
                //get the maximum number of possible pages
                const maxPages = paginator.getTotalPagesRequired();
                //then we need to work out the target page
                switch (true) {
                    case classArray.includes('back'):
                        //if it's greater than 1, one page less
                        currentPage > 1 ? currentPage-- : null;
                        break;
                    case classArray.includes('forward'):
                        //if it's less than maxpages, one page more
                        currentPage < maxPages ? currentPage++ : null;
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
    console.log('adding replay table button listeners');
    //delete replay button click handler
    $('.ui.replaysTable .showReplayLink').on('click', function () {
        console.log('Firing Show Replay Link');
        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr('data-replay-id');
        //the replay key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then((replay) => {
                //close the run replay replayEvents table
                $('.ui.fluid.runReplay.container').css('display', 'none');
                //show the section that has the table in one tab and the code in another tab
                $('.ui.fluid.showReplay.container').css('display', 'block');
                //make sure we always have replay events showing
                $(
                    '.ui.fluid.showReplay.container .ui.top.attached.replay.tabular.menu .item[data-tab="replayEvents"]'
                ).click();
                //hide the form that shows the detail of the replay event
                $('.viewDetailedTableReplayEventsFooter').css('display', 'none');
                //add the loading indicator to the table section
                $('.ui.fluid.showReplay.container .ui.bottom.attached.active.tab.segment ').addClass('loading');
                //update the checkboxes to have the current replay id
                $('.ui.fluid.showReplay.container .ui.code.form .ui.radio.checkbox input[name="outputCodeType"]').attr(
                    'data-replay-id',
                    replayKey
                );
                //then update the edit replay events table
                updateReplayEventsTableCodeReports(replay);
                //then remove the loading indicator
                $('.ui.fluid.showReplay.container .ui.bottom.attached.active.tab.segment ').removeClass('loading');
                //then report
                ga('send', {
                    hitType: 'event',
                    eventCategory: 'ReplayDetailsView',
                    eventAction: 'Click',
                    eventLabel: 'ReplayUseData',
                });
            })
            //the get single object function will reject if object is not in database
            .catch((error) => console.error(error));
    });

    //run replay button click handler
    $('.ui.replaysTable .runReplayLink').on('click', function () {
        console.log('Firing Run Replay Link');
        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr('data-replay-id');
        //the replay key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then((replay) => {
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
                //hide the image analysis segment
                $('.ui.runReplay.container .ui.basic.visualChanges.segment').hide();
                //empty the table body first
                $('.ui.runReplayReplayEventsTable.table tbody').empty();
                //get a reference to the table
                const table = document.querySelector('.ui.runReplayReplayEventsTable.table tbody');
                //then for each replayEvent we need to add it to the table and the textarea
                for (let replayEvent in replay.replayEventArray) {
                    //then borrow the function from newReplay.js
                    addNewReplayEventToTable(replay, replay.replayEventArray[replayEvent], table);
                }
                //add listeners for the clicks in the show replay replay events table
                addRunReplayReplayEventsTableButtonListeners();
            })
            //the get single object function will reject if object is not in database
            .catch((error) => console.error(error));
    });

    //delete replay button click handler
    $('.ui.replaysTable .deleteReplayLink').on('dblclick', function () {
        console.log('Firing Delete Replay Link');
        //close the show replay replayEvents table
        $('.ui.fluid.showReplay.container').css('display', 'none');
        //close the run replay replayEvents table
        $('.ui.fluid.runReplay.container').css('display', 'none');
        //delete the test in the database, using data-test-id from the template
        const replayKey = $(this).attr('data-replay-id');
        //the test key will be in string format - StorageUtils handles conversion
        StorageUtils.deleteModelObjectInDatabaseTable('replays.js', replayKey, 'replays')
            //then we have nothing returned
            .then(() => {
                //then redraw the table
                updateReplaysTable();
                //then run the function that enables the buttons
                enableVerticalMenuButtonsWhenDataAllows();
            })
            //the delete single object function will reject if object is not in database
            .catch(() => console.error(`Error Deleting Replay ${replayKey}`));
    });
}

//SLAVE SHOW REPLAY EVENTS TABLE OPERATION - THIS POPULATES THE SHOW EVENTS TABLE WITH ALL THE REPLAY EVENTS FROM THE SELECTED REPLAY
//THIS HAS A SEPARATE FUNCTION DUE TO THE COMPEXITIES OF THE CODE GENERATION - THE SLAVE RUN REPLAY POPULATION IS DONE INLINE IN THE BUTTON LISTENER

function updateReplayEventsTableCodeReports(replay) {
    console.log(replay);

    //RESET VIEW
    //empty the table body first
    $('.ui.showReplayReplayEventsTable.table tbody').empty();
    //hide the error cards
    $('.ui.four.errorEvent.stackable.cards').hide();
    //and the positive placeholder
    $('.ui.execution.positive.placeholder.segment').hide();
    //then remove any charts
    $('.ui.basic.performance.segment').remove('.resourceLoadsChart');
    //then add the replay id to the code area so we can retrieve later
    $('.replayCodeOutputTextArea').attr('data-replay-id', replay.id);

    //UPDATE TABLE

    //get a reference to the table
    const table = document.querySelector('.ui.showReplayReplayEventsTable.table tbody');
    //then for each replayEvent we need to add it to the table and the textarea
    for (let replayEvent in replay.replayEventArray) {
        //then borrow the function from newReplay.js
        addNewReplayEventToTable(replay, replay.replayEventArray[replayEvent], table);
    }
    //then for the show table we don't show the replayed column - it only has meaning in the run events context
    $('.ui.showReplayReplayEventsTable.table td[data-label="replay_timestamp_executed"]').css('display', 'none');
    //add listeners for the clicks in the show replay replay events table
    addShowReplayReplayEventsTableButtonListeners();

    //UPDATE EXECUTION HISTORY

    if (replay.mutatedReplayEventArray && replay.mutatedReplayEventArray.length > 0) {
        //first we need to see if we have any failures in the most recent replay history
        const failedReplayEventArray = replay.mutatedReplayEventArray.filter(
            (item) => item.replayEventStatus == false || item.assertionEventStatus == false
        );
        //then, if we do, we need to deliver some fail cards
        if (failedReplayEventArray.length > 0) {
            console.log('Showing Error Executions');
            //we need a map to give a visual representation of the actions
            const actionToIconMap = {
                Page: 'fab fa-chrome fa-5x',
                Mouse: 'fas fa-mouse fa-5x',
                Assertion: 'fas fa-equals fa-5x',
                Scroll: 'fas fa-arrows-alt-v fa-5x',
                ElementScroll: 'fas fa-arrows-alt-v fa-5x',
                Keyboard: 'far fa-keyboard fa-5x',
                Input: 'far fa-user fa-5x',
                TextSelect: 'fas fa-highlighter fa-5x',
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
                let failTime =
                    failedReplayEventArray[errorEvent].assertionEventReplayed ||
                    failedReplayEventArray[errorEvent].replayEventReplayed;
                failTimeNode.textContent = new Date(failTime).toLocaleString();
                //<i class="recordingOrAssertionEventActionIcon" style="color:#6435c9"></i>
                let iconNode = tempCard.querySelector('.recordingOrAssertionEventActionIcon');
                let iconAction =
                    failedReplayEventArray[errorEvent].assertionEventAction ||
                    failedReplayEventArray[errorEvent].recordingEventAction;
                //then split the font awesome class by space as we can't add multiple classes
                actionToIconMap[iconAction].split(' ').forEach((item) => iconNode.classList.add(item));
                //<div class="recordingOrAssertionEventAction header"></div>
                let actionNode = tempCard.querySelector('.recordingOrAssertionEventAction');
                actionNode.textContent =
                    failedReplayEventArray[errorEvent].assertionEventAction ||
                    failedReplayEventArray[errorEvent].recordingEventAction;
                //<span class="recordingOrAssertionEventType"></span>
                let typeNode = tempCard.querySelector('.recordingOrAssertionEventType');
                typeNode.textContent =
                    failedReplayEventArray[errorEvent].assertionType ||
                    failedReplayEventArray[errorEvent].recordingEventActionType;
                //<span class="joinedReplayOrAssertionErrorMessages"></span>
                let messagesNode = tempCard.querySelector('.recordingOrAssertionEventType');
                let messagesArray =
                    failedReplayEventArray[errorEvent].replayErrorMessages ||
                    failedReplayEventArray[errorEvent].assertionErrorMessages;
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
            console.log('Showing Good Executions');
            //hide the placeholder
            $('.ui.history.placeholder.segment').hide();
            //hide the error cards
            $('.ui.four.errorEvent.stackable.cards').hide();
            //show the positive placeholder
            $('.ui.execution.positive.placeholder.segment').show();
        }
    }

    //UPDATE PERFORMANCE TIMINGS

    if (replay.replayPerformanceTimings && Object.keys(replay.replayPerformanceTimings).length > 0) {
        console.log('Showing Performance Steps');
        let targetNode = document.querySelector('.performanceTimingsTemplate');
        //we need to do more work as we have to save the template in a table, which we don't need, we just want the row
        let targetSteps = targetNode.querySelector('.ui.three.steps');
        //make the clone
        let tempNode = targetSteps.cloneNode(true);
        //define the variables
        var startTimeNumber, startTimeString, domloadedTimeString, completeTimeString;
        //now we need to work with scenarios where we have an onCommitted time and where we don't
        if (replay.replayPerformanceTimings.hasOwnProperty('onCommitted')) {
            //save the start time
            startTimeNumber = replay.replayPerformanceTimings.onCommitted;
            startTimeString = new Date(replay.replayPerformanceTimings.onCommitted).toLocaleString();
            domloadedTimeString = `${(
                (replay.replayPerformanceTimings.onDOMContentLoaded - startTimeNumber) /
                1000
            ).toFixed(2)} seconds`;
            completeTimeString = `${((replay.replayPerformanceTimings.onCompleted - startTimeNumber) / 1000).toFixed(
                2
            )} seconds`;
        } else {
            startTimeString = 'No Start Time Available';
            domloadedTimeString = new Date(replay.replayPerformanceTimings.onDOMContentLoaded).toLocaleString();
            completeTimeString = new Date(replay.replayPerformanceTimings.onCompleted).toLocaleString();
        }
        //adjust the clone for start time
        tempNode.querySelector('.onCommittedTime.description').textContent = startTimeString;
        //and for dom loaded time
        tempNode.querySelector('.onDomLoadedTime.description').textContent = domloadedTimeString;
        //and for complete time
        tempNode.querySelector('.onCompleteTime.description').textContent = completeTimeString;
        //hide the placeholder
        $('.ui.performance.placeholder.segment').hide();
        //remove any existing steps from earlier iterations
        $('.ui.basic.performance.segment').find('DIV.ui.three.steps').remove();
        //then add the performance steps
        $('.ui.basic.performance.segment').append(tempNode);
    } else {
        //show the placeholder
        $('.ui.performance.placeholder.segment').show();
        //then remove any performance steps
        $('.ui.basic.performance.segment').find('DIV.ui.three.steps').remove();
    }

    //UPDATE RESOURCE LOADS

    if (replay.replayResourceLoads && Object.keys(replay.replayResourceLoads).length > 0) {
        console.log('Showing Resource Loads Chart');
        //then we need to create the data for the chart from the replay resource loads object
        //labels from the object keys
        const chartLabels = Object.keys(replay.replayResourceLoads);
        //data from the object values
        const chartData = Object.values(replay.replayResourceLoads);
        //then the colour variables
        let chartColours = ['red', 'gold', 'blue', 'orange', 'green', 'violet', 'dimgrey', 'purple'];
        let chartBackgroundColour = 'white';
        //then get theme setting
        const inverted = localStorage.getItem('ThemeInverted');
        //if inverted we need to change the chart background colour to black
        inverted == 'true' ? (chartBackgroundColour = 'black') : null;
        //set up the chart config
        var chartConfig = {
            //doughnut chart
            type: 'doughnut',
            //one dataset for the chart, with matched length arrays of chart data, chart colours and labels, as well as a label for the one data set
            data: {
                datasets: [{ data: chartData, backgroundColor: chartColours, label: 'Resource Loads' }],
                labels: chartLabels,
            },
            //and chart options
            options: { responsive: true },
        };
        //hide the standard placeholder
        $('.ui.resourceLoads.placeholder.segment').hide();
        //remove any existing charts from earlier iterations
        $('.ui.resourceLoads.positive.placeholder.segment').empty();
        //show the positive placeholder
        $('.ui.resourceLoads.positive.placeholder.segment').show();
        //add the canvas
        $('.ui.resourceLoads.positive.placeholder.segment').append(
            `<canvas class="resourceLoadsChart" style="display: block; max-width: 50%; height: auto; margin: 0 auto; background-color: ${chartBackgroundColour}"></canvas>`
        );
        //get the canvas context
        var ctx = document.querySelector('.resourceLoadsChart').getContext('2d');
        //draw the chart
        new Chart(ctx, chartConfig);
    } else {
        //show the standard placeholder
        $('.ui.resourceLoads.placeholder.segment:not(.positive)').show();
        //then remove any charts
        $('.ui.resourceLoads.positive.placeholder.segment').remove('.resourceLoadsChart');
        //then hide the positive placeholder segment
        $('.ui.resourceLoads.positive.placeholder.segment').hide();
    }

    //UPDATE RESOURCE LOADS
    if (replay.hasOwnProperty('replayScreenShot') && Object.keys(replay.replayScreenShot).length > 0) {
        console.log('Showing Screenshot');
        //hide the standard placeholder
        $('.ui.screenshot.placeholder.segment').hide();
        //update the image's src attribute
        $('.ui.screenshot.positive.placeholder.segment .ui.centered.big.image').prop(
            'src',
            `data:image/jpeg;base64,${replay.replayScreenShot.data}`
        );
        //show the positive placeholder
        $('.ui.screenshot.positive.placeholder.segment').show();
    } else {
        //show the standard screenshot placeholder
        $('.ui.screenshot.placeholder.segment:not(.positive)').show();
        //hide the positive screenshot placeholder
        $('.ui.screenshot.positive.placeholder.segment').hide();
    }
}

//SLAVE SHOW REPLAY EVENTS TABLE OPERATION - THIS ADDS BUTTON LISTENERS FOR SUBORDINATE SHOW REPLAY, REPLAY EVENTS TABLE

function addShowReplayReplayEventsTableButtonListeners() {
    $('.ui.showReplayReplayEventsTable.table .showReplayEventRow').on('click', function () {
        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr('data-replay-id');
        //do the same with the replay event key
        const replayEventKey = $(this).attr('data-replay-event-id');
        //the replay key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then((replay) => {
                //use either the replay or assertion id to get the replay event
                const replayEvent = replay.replayEventArray.find(
                    (event) => event.replayEventId == replayEventKey || event.assertionId == replayEventKey
                );
                //fill the form fields with the data from the replay event
                $('.ui.viewReplayEvent.form input[name=replay_recordingEventCssSelectorPath]').val(
                    replayEvent.recordingEventCssSelectorPath
                );
                $('.ui.viewReplayEvent.form input[name=replay_recordingEventCssDomPath]').val(
                    replayEvent.recordingEventCssDomPath
                );
                $('.ui.viewReplayEvent.form input[name=replay_recordingEventCssFinderPath]').val(
                    replayEvent.recordingEventCssFinderPath
                );
                $('.ui.viewReplayEvent.form input[name=replay_recordingEventXPath]').val(
                    replayEvent.recordingEventXPath
                );
                $('.ui.viewReplayEvent.form input[name=replay_recordingEventLocation]').val(
                    replayEvent.recordingEventLocationHref
                );
                //then the checkbox
                replayEvent.recordingEventIsIframe == true
                    ? $('.ui.viewReplayEvent .ui.checkbox input[name=replay_recordingEventIsIframe]').prop(
                          'checked',
                          true
                      )
                    : $('.ui.viewReplayEvent .ui.checkbox input[name=replay_recordingEventIsIframe]').prop(
                          'checked',
                          false
                      );
                //show the form
                $('.viewDetailedTableReplayEventsFooter').css('display', 'table-row');
            })
            //the get single object function will reject if object is not in database
            .catch((error) => console.error(error));
    });

    $('.ui.showReplayReplayEventsTable.table .deleteReplayEventRow').on('click', function () {
        //find the replay in the database by id, using data-replay-id from the template
        const replayKey = $(this).attr('data-replay-id');
        //do the same with the replay event key
        const replayEventKey = $(this).attr('data-replay-event-id');
        //the replay key will be in string format - StorageUtils handles conversion
        StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
            //then we have a returned js object with the replay details
            .then((replay) => {
                console.log(replay);
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
                //this is specific to the showReplayReplayEventsTable, also used on initial display
                updateReplayEventsTableCodeReports(savedReplay);
            })
            //the get single object function will reject if object is not in database
            .catch((error) => console.error(error));
    });
}

//SLAVE RUN REPLAY EVENTS TABLE OPERATION - THIS ADDS BUTTON LISTENERS FOR SUBORDINATE RUN REPLAY, REPLAY EVENTS TABLE

function addRunReplayReplayEventsTableButtonListeners() {
    $('.ui.runReplayReplayEventsTable.table .showReplayEventRow').on('click', function () {
        console.log('Firing Run Replay Table Row Show Link');
        //here we deal with messages that are appended to the html as the replay is running
        //we have log messages for all replay events
        const logMessages = JSON.parse($(this).attr('data-log-messages'));
        //we will have error messages for some replay events
        const errorMessages = JSON.parse($(this).attr('data-error-messages'));
        //show the information row
        $('.ui.runReplayReplayEventsTable.table .informationMessageRow').css('display', 'table-row');
        //then what we show depends on the content of the messages
        switch (true) {
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

    $('.ui.runReplayReplayEventsTable.table .deleteReplayEventRow').on('click', function () {
        console.log('Firing Run Replay Table Row Delete Link');
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
                $('.ui.runReplayReplayEventsTable.table tbody').empty();
                //get a reference to the table
                const table = document.querySelector('.ui.runReplayReplayEventsTable.table tbody');
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

//MAIN FUNCTION BUTTONS FOR RUNNING THE REPLAY

function addReplayEventsTableStartReplayHandler() {
    //REPLAYING EVENTS START HANDLER
    Rx.Observable.fromEvent(document.querySelector('.ui.runReplay.container .ui.startReplay.positive.button'), 'click')
        //we only need to take one of these clicks at a time, the listener is refreshed on completion
        .take(1)
        //make the changes to the ui to indicate that we have started
        .do((event) => {
            //show the start replay button as disabled
            event.target.className += ' disabled';
            //show the stop replay button as enabled
            $('.ui.runReplay.container .ui.stopReplay.negative.button').removeClass('disabled');
            //remove all the indicators from the table rows, apart from disabled and assertion row
            $(`.ui.runReplayReplayEventsTable.table tr`).removeClass('positive');
            $(`.ui.runReplayReplayEventsTable.table tr`).removeClass('negative');
            //show the replay loader
            $('.ui.runReplay.container .ui.text.small.replay.loader').addClass('active');
            //and hide the 'replay has not run' message if it's showing
            $('.ui.warning.noDetails.message').css('display', 'none');
            //and the various logging messages
            $('.ui.runReplayReplayEventsTable.table .ui.info.logging.message').css('display', 'none');
            $('.ui.runReplayReplayEventsTable.table .ui.negative.error.message').css('display', 'none');
            //then report to Google analytics so we can see how often replays happen
            ga('send', {
                hitType: 'event',
                eventCategory: 'ExistingReplayRun',
                eventAction: `Click`,
                eventLabel: 'ReplayUseData',
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
                processReplayEvents(replay, '.ui.runReplayReplayEventsTable.table', '.ui.runReplay.container')
            )
        )
        //report that the replay events have all completed
        .do((replay) => console.log(`ALL REPLAY EVENTS COMPLETED FOR REPLAY: ${replay.replayName}`))
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
                //if the user has selected visual regression analysis, now is the time to do it
                //BORROWING FUNCTION FROM newReplay.js
                if (
                    mutatedReplay.recordingTestVisualRegression &&
                    mutatedReplay.hasOwnProperty('replayScreenShot') &&
                    Object.keys(mutatedReplay.replayScreenShot).length > 0
                ) {
                    //the function needs to have the container to find the images, the current screenshot data uri saved to the database and the reported screenshot data uri
                    //the function needs to have the container to find the images, the current screenshot saved to the database and the reported screenshot
                    runVisualRegressionAnalysis(
                        '.ui.runReplay.container',
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
                $('.ui.runReplay.container .ui.text.small.replay.loader').removeClass('active');
                //show the start button as enabled
                $('.ui.runReplay.container .ui.startReplay.positive.button').removeClass('disabled');
                //show the stop replay button as disabled
                $('.ui.runReplay.container .ui.stopReplay.negative.button').addClass('disabled');
                //then we need to add the start recording handler again
                addReplayEventsTableStartReplayHandler();
            },
            (error) => {
                console.error(`Process Replay Error ${error}`);
                //hide the replay loader
                $('.ui.runReplay.container .ui.text.small.replay.loader').removeClass('active');
                //show the start button as enabled
                $('.ui.runReplay.container .ui.startReplay.positive.button').removeClass('disabled');
                //show the stop replay button as disabled
                $('.ui.runReplay.container .ui.stopReplay.negative.button').addClass('disabled');
                //then we need to add the start recording handler again
                addReplayEventsTableStartReplayHandler();
            }
        );
}

function loadReplayCodeStringIntoTargetContainer(replayKey, selector, translator) {
    //empty the target div
    $(`${selector}`).empty();
    //the replay key will be in string format - StorageUtils handles conversion
    StorageUtils.getSingleObjectFromDatabaseTable('replays.js', replayKey, 'replays')
        //then build the string
        .then((replay) => translator.buildReplayStringFromEvents(replay))
        //then load the string into the code mirror
        .then((string) => {
            const inverted = localStorage.getItem('ThemeInverted');
            window.replayCodeMirror = CodeMirror(document.querySelector('.replayCodeOutputTextArea'), {
                value: string,
                mode: 'javascript',
                theme: inverted == 'true' ? 'darcula' : 'default',
                lineNumbers: true,
                readOnly: true,
            });
            //then report
            ga('send', {
                hitType: 'event',
                eventCategory: 'ReplayCodeView',
                eventAction: 'Click',
                eventLabel: 'ReplayUseData',
            });
        });
}

$(document).ready(function () {
    //add the listener for the run replay button
    addReplayEventsTableStartReplayHandler();
    //activate the tab control
    $('.ui.showReplay.container .ui.top.attached.replay.tabular.menu .item').tab({
        //we need to rehide stuff as tabs are shown
        onVisible: function (tab) {
            switch (tab) {
                case 'replayEvents':
                    //hide the warning message about events with no information by default
                    $('.ui.showReplayReplayEventsTable.table .informationMessageRow').css('display', 'none');
                    //then report
                    ga('send', {
                        hitType: 'event',
                        eventCategory: 'ReplayEventsView',
                        eventAction: 'TabClick',
                        eventLabel: 'ReplayUseData',
                    });
                    break;
                case 'replayCode':
                    //init the checkbox, with Javascript checked as default
                    $('.ui.showReplay.container .ui.radio.checkbox input[value="cypress"]').prop('checked', true);
                    //UPDATE CODE FOR CYPRESS BY DEFAULT
                    loadReplayCodeStringIntoTargetContainer(
                        document.querySelector('.replayCodeOutputTextArea').getAttribute('data-replay-id'),
                        '.replayCodeOutputTextArea',
                        new CypressTranslator({})
                    );
                    //then report
                    ga('send', {
                        hitType: 'event',
                        eventCategory: 'ReplayCodeView',
                        eventAction: 'TabClick',
                        eventLabel: 'ReplayUseData',
                    });
                    break;
                case 'replayReports':
                    //then report
                    ga('send', {
                        hitType: 'event',
                        eventCategory: 'ReplayReportView',
                        eventAction: 'TabClick',
                        eventLabel: 'ReplayUseData',
                    });
            }
        },
    });

    //activate the copy to clipboard button
    $('.ui.fluid.showReplay.container .ui.copyCodeToClipBoard.icon.button').on('click', function () {
        //get the text from the text area
        const textToCopy = window.replayCodeMirror.getDoc().getValue();
        //then paste that into the clipboard
        navigator.clipboard.writeText(textToCopy);
        //then report
        ga('send', {
            hitType: 'event',
            eventCategory: 'ReplayCodeCopy',
            eventAction: 'Clipboard',
            eventLabel: 'ReplayUseData',
        });
    });

    //activate the download code as js file button
    $('.ui.showReplay.container .ui.downloadCodeToFile.submit.button').on('click', function (event) {
        //make sure the submit button does not perform its usual reload function
        event.preventDefault();
        //get the text from the text area
        const textToCopy = window.replayCodeMirror.getDoc().getValue();
        //create a blob from the text - maybe set this to "text/plain" when we no longer want to use vscode to check formatting of emitted code
        var blob = new Blob([textToCopy], { type: 'text/javascript' });
        //create a local temporary url - the object URL can be used as download URL
        var url = URL.createObjectURL(blob);
        //then download
        chrome.downloads.download({
            url: url,
            filename: 'RecordReplay.js',
        });
        //then report
        ga('send', {
            hitType: 'event',
            eventCategory: 'ReplayCodeDownload',
            eventAction: 'Download',
            eventLabel: 'ReplayUseData',
        });
    });

    //respond to requested code language changes, which requires getting the replay from the server and processing it
    $('.ui.fluid.showReplay.container .ui.code.form .ui.radio.checkbox').change((event) => {
        switch (true) {
            case event.target.value == 'cypress':
                loadReplayCodeStringIntoTargetContainer(
                    event.target.getAttribute('data-replay-id'),
                    '.replayCodeOutputTextArea',
                    new CypressTranslator({})
                );
                //then report
                ga('send', {
                    hitType: 'event',
                    eventCategory: 'ReplayCodeLanguage',
                    eventAction: 'TranslateCypress',
                    eventLabel: 'ReplayUseData',
                });
                break;
            case event.target.value == 'jest+puppeteer':
                loadReplayCodeStringIntoTargetContainer(
                    event.target.getAttribute('data-replay-id'),
                    '.replayCodeOutputTextArea',
                    new JestTranslator({ translator: 'Puppeteer' })
                );
                //then report
                ga('send', {
                    hitType: 'event',
                    eventCategory: 'ReplayCodeLanguage',
                    eventAction: 'TranslateJestPuppeteer',
                    eventLabel: 'ReplayUseData',
                });
                break;
            case event.target.value == 'jest+testinglibrary':
                loadReplayCodeStringIntoTargetContainer(
                    event.target.getAttribute('data-replay-id'),
                    '.replayCodeOutputTextArea',
                    new JestTranslator({ translator: 'TestingLibrary' })
                );
                //then report
                ga('send', {
                    hitType: 'event',
                    eventCategory: 'ReplayCodeLanguage',
                    eventAction: 'TranslateJestTestingLibrary',
                    eventLabel: 'ReplayUseData',
                });
                break;
            case event.target.value == 'jest+selenium':
                loadReplayCodeStringIntoTargetContainer(
                    event.target.getAttribute('data-replay-id'),
                    '.replayCodeOutputTextArea',
                    new JestTranslator({ translator: 'Selenium' })
                );
                //then report
                ga('send', {
                    hitType: 'event',
                    eventCategory: 'ReplayCodeLanguage',
                    eventAction: 'TranslateJestSelenium',
                    eventLabel: 'ReplayUseData',
                });
                break;
            default:
                $('.ui.fluid.showReplay.container .codeOutputTextArea').val('UNRECOGNISED CODE FORMAT');
        }
    });
});
