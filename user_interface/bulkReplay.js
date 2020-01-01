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

    //get the tests data from the database so we can have recordings linked to tests
    StorageUtils.getAllObjectsInDatabaseTable('bulkReplay.js', 'tests')
        //once we have the array then we can start populating the new test form projects dropdwon by looping through the array
        .then(testStorageArray => {
            
            //filter tests for default project by fetching from local storage
            const defaultProjectId = Number(localStorage.getItem("DefaultProject"));
            //if we have any number greater than zero, which indicates no default, then filter
            defaultProjectId > 0 ? testStorageArray = testStorageArray.filter(test => test.testProjectId == defaultProjectId) : null;

            //get a reference to the drop down in the bulk replay form
            var newRecordingDropDownMenu = $('.ui.fluid.selection.bulkReplay.test.dropdown .menu');
            //empty the dropdown of existing items
            newRecordingDropDownMenu.empty();
            //use for-in loop as execution order is maintained to insert all the tests, with references, in the dropdown
            for (let test in testStorageArray) {     
                //we are not going to use templates here as we are not dealing with complex html structures
                newRecordingDropDownMenu.append(`<div class="item" data-value=${testStorageArray[test].id}>${testStorageArray[test].testName}</div>`);
            }
            //then after the entire loop has been executed we need to initialise the dropdown with the updated items
            $('.ui.fluid.selection.bulkReplay.test.dropdown').dropdown({
                onChange: function(value) {
                    //update the start and stop buttons to contain the correct test id
                    $('.ui.bulkReplay.form .ui.startBulkReplay.positive.button').attr('data-test-id', value);
                    $('.ui.bulkReplay.form .ui.stopBulkReplay.negative.button').attr('data-test-id', value);
                    //data value always returns a string and we need the id in number form
                    const testId = Number(value);
                    //find all the replays that have a matching id
                    StorageUtils.getAllObjectsInDatabaseTable('bulkReplay.js', 'replays')
                        //once we have the array of all the replays we need to start populating the tab control
                        .then(replayStorageArray => {
                            //filter the replays for the matching test id
                            replayStorageArray = replayStorageArray.filter(replay => replay.recordingTestId == testId);
                            //then populate, activate and show each of the tabs using separate function
                            populateBulkReplayTabs(replayStorageArray);
                        });
                }

            });

        });  

}