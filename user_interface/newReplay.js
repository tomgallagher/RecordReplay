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
                }

            });

        });  

}


$(document).ready (function(){

});