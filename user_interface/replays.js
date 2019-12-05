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
        let replayEditLink = tempNode.querySelector('.editReplayLink');
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
    //addReplayTableButtonListeners();

}

function addRecordingTablePaginationListener() {

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

$(document).ready (function(){

});