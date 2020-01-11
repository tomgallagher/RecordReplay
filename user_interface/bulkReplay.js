function populateBulkReplayTabs(replayStorageArray) {

    //get a reference to the container segment
    $container = $('.ui.bulkReplay.segment');
    //get a reference to the target tab menu
    $tabMenu = $('.ui.top.attached.bulkReplay.tabular.menu');
    //empty the tab menu from any existing changes
    $tabMenu.empty();
    //then we need to remove any existing bottom attached tab segments
    $container.find('DIV.ui.bottom.attached.tab.segment').remove();
    //then if there are no replays in the test we just make the tab control invisible again and return
    if (replayStorageArray == 0) {
        //then disable the start button
        $('.ui.bulkReplay.form .ui.startBulkReplay.positive.button').addClass('disabled');
        //hide the tab control as its tabs are empty
        $tabMenu.css('visibility', 'hidden');
        //then return
        return;
    }
    //then we need to loop through the replays to add the correct tab menu item
    for (let replay in replayStorageArray) {    
        //we are not going to use templates here as we are not dealing with complex html structures
        //replay here is actually a string so we need to convert to a number and add one to stop starting at zero
        $tabMenu.append(`<div class="item" data-tab="${replayStorageArray[replay].id}">${(Number(replay)+1).toString()}</div>`);
    }
    //then we need to loop through the replays to add the correct bottom attached tab segment
    //this can result in a lot of stuff being added so we use fragments and templates
    //target our bottom attached tab segment template first, we only need to find the template once
    let targetNode = document.querySelector('.bulkReplayTabTemplate');
    //we need to do more work to find the segment itself
    let targetSegment = targetNode.querySelector('.ui.bottom.attached.tab.segment');
    //then create a document fragment that we will use as a container for each looped template
    let docFrag = document.createDocumentFragment();

    for (let replay in replayStorageArray) {    
        //then we make a clone of the segment, that will serve the purpose
        let tempNode = targetSegment.cloneNode(true);
        //we need to make a direct addition to the segment itself - no need for query selector
        tempNode.setAttribute('data-tab', replayStorageArray[replay].id);
        
        //<div class="ui center aligned header" data-replay-id=""></div>
        let headerNode = tempNode.querySelector('.ui.center.aligned.header');
        headerNode.setAttribute('data-replay-id', replayStorageArray[replay].id);
        headerNode.textContent = replayStorageArray[replay].replayName;

        //<table class="ui small violet celled single line center aligned compact bulkReplayReplayEventsTable unstackable table" data-replay-id="">
        let tableNode = tempNode.querySelector('.ui.bulkReplayReplayEventsTable.table');
        tableNode.setAttribute('data-replay-id', replayStorageArray[replay].id);
        
        //then we borrow the function from newReplay.js to populate the table
        for (let replayEvent in replayStorageArray[replay].replayEventArray) {   
            //add each event to the table using the function
            addNewReplayEventToTable(replayStorageArray[replay], replayStorageArray[replay].replayEventArray[replayEvent], tableNode)
        }

        //<tr class="informationMessageRow" style="display: none;" data-replay-id="">
        let informationNode = tempNode.querySelector('.informationMessageRow');
        informationNode.setAttribute('data-replay-id', replayStorageArray[replay].id);

        //<div class="ui warning noDetails message" style="display: none;" data-replay-id="">
        let noDetailsNode = tempNode.querySelector('.ui.warning.noDetails.message');
        noDetailsNode.setAttribute('data-replay-id', replayStorageArray[replay].id);

        //<div class="ui info logging message" style="display: none; white-space: normal;" data-replay-id="">
        let loggingNode = tempNode.querySelector('.ui.info.logging.message');
        loggingNode.setAttribute('data-replay-id', replayStorageArray[replay].id);

        //<ul class="logging list" data-replay-id=""></ul>
        let loggingListNode = tempNode.querySelector('.logging.list');
        loggingListNode.setAttribute('data-replay-id', replayStorageArray[replay].id);

        //<div class="ui negative error message" style="display: none; white-space: normal;" data-replay-id="">
        let errorNode = tempNode.querySelector('.ui.negative.error.message');
        errorNode.setAttribute('data-replay-id', replayStorageArray[replay].id);

        //<ul class="error list" data-replay-id=""></ul>
        let errorListNode = tempNode.querySelector('.error.list');
        errorListNode.setAttribute('data-replay-id', replayStorageArray[replay].id);                                   

        //<div class="ui basic visualChanges segment" data-replay-id="" style="display: none;">
        let visualChangesNode = tempNode.querySelector('.ui.basic.visualChanges.segment');
        visualChangesNode.setAttribute('data-replay-id', replayStorageArray[replay].id);

        //<img class="previousRunImage" data-replay-id="" src="">
        let previousRunImageNode = tempNode.querySelector('.previousRunImage');
        previousRunImageNode.setAttribute('data-replay-id', replayStorageArray[replay].id);

        //<img class="currentRunImage" data-replay-id="" src="">
        let currentRunImageNode = tempNode.querySelector('.currentRunImage');
        currentRunImageNode.setAttribute('data-replay-id', replayStorageArray[replay].id);

        //<img class="visualRegressionImage" data-replay-id="" src="">
        let regressionImageNode = tempNode.querySelector('.visualRegressionImage');
        regressionImageNode.setAttribute('data-replay-id', replayStorageArray[replay].id);

        //then we need to attach the clone of the template node to our container fragment
        docFrag.appendChild(tempNode);
    }
    
    //then we append the fragment to the table
    $container.append(docFrag);
    
    //then activate the tab control
    $('.ui.bulkReplay.segment .ui.top.attached.bulkReplay.tabular.menu .item').tab({});

    //then show the tab menu
    $tabMenu.css('visibility', 'visible');

    //then add the active class by clicking
    $('.ui.bulkReplay.segment .ui.top.attached.bulkReplay.tabular.menu .item').first().click();

    //then enable the start button
    $('.ui.bulkReplay.form .ui.startBulkReplay.positive.button').removeClass('disabled');

}

function refreshBulkReplayTestDropdown() {

    Promise.all([
            //get all the projects from the database
            StorageUtils.getAllObjectsInDatabaseTable('bulkReplay.js', 'projects'),
            //get the tests data from the database so we can have recordings linked to tests
            StorageUtils.getAllObjectsInDatabaseTable('bulkReplay.js', 'tests')
        ])
        //once we have the array then we can start populating the bulk replay dropdown by looping through the array
        .then(([projectStorageArray, testStorageArray]) => {
            
            //filter arrays for default project by fetching from local storage
            const defaultProjectId = Number(localStorage.getItem("DefaultProject"));

            //if we have any number greater than zero, which indicates no default, then filter the projects for the default project
            defaultProjectId > 0 ? projectStorageArray = projectStorageArray.filter(project => project.id == defaultProjectId) : null;
            //if we have any number greater than zero, which indicates no default, then filter the tests for the default project
            defaultProjectId > 0 ? testStorageArray = testStorageArray.filter(test => test.testProjectId == defaultProjectId) : null;

            //get a reference to the drop down in the bulk replay form
            var newRecordingDropDownMenu = $('.ui.fluid.selection.bulkReplay.test.dropdown .menu');
            //empty the dropdown of existing items
            newRecordingDropDownMenu.empty();

            //then we add the projects to the dropdown
            for (let project in projectStorageArray) {     
                //we are not going to use templates here as we are not dealing with complex html structures
                newRecordingDropDownMenu.append(`<div class="item" data-value=${projectStorageArray[project].id} data-type="project">[Project] ${projectStorageArray[project].projectName}</div>`);
            }

            //then we add the tests to the dropdown
            for (let test in testStorageArray) {     
                //we are not going to use templates here as we are not dealing with complex html structures
                newRecordingDropDownMenu.append(`<div class="item" data-value=${testStorageArray[test].id} data-type="test">[Test] ${testStorageArray[test].testName}</div>`);
            }

            //then after the entire loop has been executed we need to initialise the dropdown with the updated items
            $('.ui.fluid.selection.bulkReplay.test.dropdown').dropdown({
                onChange: function(value, text, $selectedItem) {
                    //first we need to get all the replays
                    StorageUtils.getAllObjectsInDatabaseTable('bulkReplay.js', 'replays')
                        //then what we do with the replays depends upon whether we have selected a project or a test
                        .then(replayStorageArray => {
                            //first we deal with projects
                            if ($selectedItem.attr("data-type") == 'project') {
                                //update the start and stop buttons to contain the correct project id
                                $('.ui.bulkReplay.form .ui.startBulkReplay.positive.button').attr('data-project-id', value);
                                $('.ui.bulkReplay.form .ui.stopBulkReplay.negative.button').attr('data-project-id', value);
                                //remove the data-test-id attribute from the buttons
                                $('.ui.bulkReplay.form .ui.startBulkReplay.positive.button').removeAttr("data-test-id");
                                $('.ui.bulkReplay.form .ui.stopBulkReplay.negative.button').removeAttr("data-test-id");
                                //data value always returns a string and we need the id in number form
                                const projectId = Number(value);
                                //filter the replays for the matching test id
                                replayStorageArray = replayStorageArray.filter(replay => replay.recordingProjectId == projectId);
                                //then populate, activate and show each of the tabs using separate function
                                populateBulkReplayTabs(replayStorageArray);
                            } else {
                                //update the start and stop buttons to contain the correct test id
                                $('.ui.bulkReplay.form .ui.startBulkReplay.positive.button').attr('data-test-id', value);
                                $('.ui.bulkReplay.form .ui.stopBulkReplay.negative.button').attr('data-test-id', value);
                                //remove the data-project-id attribute from the buttons
                                $('.ui.bulkReplay.form .ui.startBulkReplay.positive.button').removeAttr("data-project-id");
                                $('.ui.bulkReplay.form .ui.stopBulkReplay.negative.button').removeAttr("data-project-id");
                                //data value always returns a string and we need the id in number form
                                const testId = Number(value);
                                //filter the replays for the matching test id
                                replayStorageArray = replayStorageArray.filter(replay => replay.recordingTestId == testId);
                                //then populate, activate and show each of the tabs using separate function
                                populateBulkReplayTabs(replayStorageArray);
                            }

                        });
                        
                }

            });

        });  

}

function runBulkReplay(projectOrTestID, bulkReplayType) {

    //we need to have the testID as a number
    const projectOrTestIDAsNumber = StorageUtils.standardiseKey(projectOrTestID)
    //first we need to get all the replays from storage, delivered as an array
    Rx.Observable.fromPromise(StorageUtils.getAllObjectsInDatabaseTable('bulkReplay.js', 'replays'))
        //then we want to get each of the replays in the array as a separate entity that we can process
        .mergeAll()
        //then we want to filter each replay so we only process matching replays
        .filter(replay => bulkReplayType == 'project' ? replay.recordingProjectId == projectOrTestIDAsNumber : replay.recordingTestId == projectOrTestIDAsNumber)
        //then we want to process each replay in turn, waiting for it to finish before we move on
        .concatMap(replay => Rx.Observable.fromPromise(processEachReplay(replay)) )
        //then we have a variety of things we need to do when all the replays have completed
        .subscribe(
            replay => console.log(replay),
            error => console.error(error),
            () => {
                //hide the loader
                $('.ui.bulkReplay.form .ui.text.small.bulkReplay.loader').removeClass('active');
                //disable the stop button
                $('.ui.bulkReplay.form .ui.stopBulkReplay.negative.button').addClass('disabled');
                //enable the start button
                $('.ui.bulkReplay.form .ui.startBulkReplay.positive.button').removeClass('disabled');
                //add the listeners for the images
                $('.ui.bottom.attached.tab .previousRunImage, .ui.bottom.attached.tab .currentRunImage, .ui.bottom.attached.tab .visualRegressionImage').on('click', function() {
                    //first we want to get the target src
                    const src = $(this).prop('src');
                    //then we set the modal src 
                    $('.ui.large.modal .visualCheckBlowUp').prop('src', src);
                    //then we show the modal
                    $('.large.modal').modal('show');
                })
            }
        );

}

function processEachReplay(replay) {

    return new Promise(resolve => {

        Rx.Observable.of(replay)
            //then when we start to process, we want to show the tab that we are currently processing - add the active class by clicking
            .do(replay => $(`.ui.bulkReplay.segment .ui.top.attached.bulkReplay.tabular.menu .item[data-tab="${replay.id}"]`).first().click())
            //process the replay using the routine from newreplay.js
            .flatMap(replay =>  Rx.Observable.fromPromise(
                //then we need to process each of the replay events, passing a reference to the correct table and a reference to the container so the stop button cancels
                processReplayEvents(replay, `.ui.bulkReplayReplayEventsTable.table[data-replay-id="${replay.id}"]`, '.ui.bulkReplay.segment')
            ))
            //then we need to collect any reports that may be required for this replay from the replay's tab runner
            .switchMap( () =>
                //send the message and wait for the response promise to be fulfilled
                Rx.Observable.fromPromise(new RecordReplayMessenger({}).sendMessageGetResponse({getReportObject: "Make Request for Report Object"})),
                (mutatedReplay, response) => {
                    //update the performance timings if required
                    mutatedReplay.recordingTestPerformanceTimings ? mutatedReplay.replayPerformanceTimings = response.reportObject.performanceTimings : null;
                    //update the resource loads if required
                    mutatedReplay.recordingTestResourceLoads ? mutatedReplay.replayResourceLoads = response.reportObject.resourceLoads : null;
                    //if the user has selected visual regression analysis, now is the time to do it
                    //BORROWING FUNCTION FROM newReplay.js
                    if (mutatedReplay.recordingTestVisualRegression && mutatedReplay.hasOwnProperty('replayScreenShot') && Object.keys(mutatedReplay.replayScreenShot).length > 0) {     //the function needs to have the container to find the images, the current screenshot data uri saved to the database and the reported screenshot data uri
                        //the function needs to have the container to find the images, the current screenshot saved to the database and the reported screenshot
                        runVisualRegressionAnalysis(`.ui.bottom.attached.tab.segment[data-tab="${replay.id}"]`, mutatedReplay.replayScreenShot.data, response.reportObject.screenShot.data); 
                    }
                    //update the screenshot if required
                    mutatedReplay.recordingTestScreenshot ? mutatedReplay.replayScreenShot = response.reportObject.screenShot : null;
                    //return mutated replay with reports
                    return mutatedReplay;    
                }
            )
            //then we need to save the updated replay events and any reports to the database
            .switchMap(mutatedReplayReports => 
                Rx.Observable.fromPromise(StorageUtils.updateModelObjectInDatabaseTable('replays.js', mutatedReplayReports.id, mutatedReplayReports, 'replays')),
                //then just return the active replay
                (updatedActiveReplay) => updatedActiveReplay 
            )
            //then we need to send the command to close the debugger
            .switchMap(replay => 
                Rx.Observable.fromPromise(new RecordReplayMessenger({}).sendMessageGetResponse({stopNewReplay: replay})),
                //then just log the response and return the active replay
                (activeReplay, response) => {
                    console.log(response.message);
                    return activeReplay;
                }
            )
            .subscribe(
                x => resolve(x),
                error => console.error(error)
            );

    });

}

$(document).ready (function(){

    $('.ui.bulkReplay.form .ui.startBulkReplay.positive.button').on('click', (event) => {

        //we don't want the submit button to submit
        event.preventDefault();
        //then we want to disable the start button until the test has finished
        $(this).addClass('disabled');
        //and enable the stop button
        $('.ui.bulkReplay.form .ui.stopBulkReplay.negative.button').removeClass('disabled');
        //show the loader
        $('.ui.bulkReplay.form .ui.text.small.bulkReplay.loader').addClass('active');
        //remove all the indicators from the table rows, apart from disabled and assertion row
        $(`.ui.bulkReplayReplayEventsTable.table tr`).removeClass('positive');
        $(`.ui.bulkReplayReplayEventsTable.table tr`).removeClass('negative');
        //then we want to pass the value of the project or test id to the function that runs the bulk replay
        event.target.hasAttribute('data-project-id') ? runBulkReplay(event.target.getAttribute('data-project-id'), "project") : runBulkReplay(event.target.getAttribute('data-test-id'), "test");
        //then report to Google analytics so we can see how often bulk replays happen 
        ga('send', { hitType: 'event', eventCategory: 'BulkReplayRun', eventAction: `Click`, eventLabel: 'ReplayData'});

    })

});