function updateRecordingsTable() {

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

    //first get all the current recordings from the database, as an array, then loop through the array to update the UI
    StorageUtils.getAllObjectsInDatabaseTable('recordings.js', 'recordings')
        //once we have the array then we can start populating the table by looping through the array
        .then(recordingStorageArray => {

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
                recordingAdditionalReportingNode.textContent = additionalReportsArray.join(',');
                //TO DO add mobile / portrait
                let recordingEditButton = tempNode.querySelector('.ui.editRecording.button');
                recordingEditButton.setAttribute('data-recording-id', `${recordingStorageArray[recording].id}`);
                let recordingDeleteButton = tempNode.querySelector('.ui.deleteRecording.button');
                recordingDeleteButton.setAttribute('data-recording-id', `${recordingStorageArray[recording].id}`);
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
            //TO DO add the listeners for the buttons built into the form

        });

}