function refreshNewRecordingTestDropdown() {

    //get the tests data from the database so we can have recordings linked to tests
    StorageUtils.getAllObjectsInDatabaseTable('newRecording.js', 'tests')
        //once we have the array then we can start populating the new test form projects dropdwon by looping through the array
        .then(testStorageArray => {
            
            //get a reference to the drop down in the new recording form
            var newRecordingDropDownMenu = $('.ui.fluid.selection.newRecording.test.dropdown .menu');
            //empty the dropdown of existing items
            newRecordingDropDownMenu.empty();
            //use for-in loop as execution order is maintained to insert all the tests, with references, in the dropdown
            for (let test in testStorageArray) {     
                //we are not going to use templates here as we are not dealing with complex html structures
                newRecordingDropDownMenu.append(`<div class="item" data-value=${testStorageArray[test].id}>${testStorageArray[test].testName}</div>`);
            }
            //then after the entire loop has been executed we need to initialise the dropdown with the updated items
            $('.ui.fluid.selection.newRecording.test.dropdown').dropdown({
                onChange: function(value) {
                    //data value always returns a string and we need the id in number form
                    const testId = Number(value);
                    //then we need to get the right item from the array so we can populate the test start url field in the visible form
                    const test = testStorageArray.find(item => item.id == testId);
                    //populate the visible form but leave it disabled - it's readable but the form does not mutate and require reseting
                    $('.ui.newRecordingForm.form input[name=recordingTestStartUrl]').val(test.testStartUrl);
                }

            });

        });  

}


$(document).ready (function(){

    //just need a simple handler for the check box to state computer or mobile emulation
    $('.ui.newRecordingForm.form .ui.radio.device.checkbox').change(function(event){
        if (event.target.value == "mobile") {
            $('.ui.newRecordingForm.form .orientation.field').removeClass('disabled');
        } else { 
            $('.ui.newRecordingForm.form .orientation.field').addClass('disabled'); 
        }
    });

    //this is where the main recording action gets kicked off
    $('.ui.startRecording.positive.button').on('mousedown', function() {
        //show the recording loader
        $('.ui.text.small.recording.loader').addClass('active');
    });

    //this is where we stop recording and save the recording events to the object
    $('.ui.stopRecording.negative.button').on('mousedown', function() {
        //hide the recording loader
        $('.ui.text.small.recording.loader').removeClass('active');
    });

    $('.ui.newRecordingForm.form')
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
                //add the loading indicator to the button, to indicate saving of the test to the database
                $('.ui.newRecordingForm .ui.submit.button').addClass('loading');
                //just keep track of field names - they must be the same as model attributes when we create a new class object
                console.log(fields);
                // eg { computer: "on", landscape: false, mobile: false, portrait: "on", recordingAuthor: "", recordingDescription: "", recordingName: "efe", recordingTestId: "1", recordingTestStartUrl: "https://turbobrowser.eu/" }
                // so we need to merge the recording with its matched test
                StorageUtils.getSingleObjectFromDatabaseTable('newRecording.js', fields.recordingTestId, 'tests')
                    //then we have a returned js object with the test details
                    .then(test => {
                        //create our new recording object
                        const newRecording =  new Recording({
                            //displayed fields from form 
                            recordingName: fields.recordingName,
                            recordingDescription: fields.recordingDescription || "N/A",
                            recordingAuthor: fields.recordingDescription || "N/A",
                            recordingIsMobile: fields.device == "computer" ? false : true,
                            recordingMobileOrientation: fields.orientation,
                            recordingTestStartUrl: fields.recordingTestStartUrl,
                            //inherited defaults from storage table queried by string recordingTestId selection drop down
                            recordingProjectId: test.testProjectId,
                            recordingProjectName: test.testProjectName,
                            recordingTestId: test.id,
                            recordingTestName: test.testName,
                            recordingTestBandwidthValue: test.testBandwidthValue,
                            recordingTestBandwidthName: test.testBandwidthName,
                            recordingTestLatencyValue: test.testLatencyValue,
                            recordingTestLatencyName: test.testLatencyName,
                            recordingTestPerformanceTimings: test.testPerformanceTimings,
                            recordingTestResourceLoads: test.testResourceLoads,
                            recordingTestScreenshot: test.testScreenshot,
                        });
                        console.log(newRecording);
                        //then we need to save to the database
                        StorageUtils.addModelObjectToDatabaseTable('newRecording.js', newRecording, 'recordings')
                            //which does not return anything but we don't need it as we fetch from database directly to update the projects table
                            .then( () => {
                                //remove the loading indicator from the button
                                $('.ui.newRecordingForm .ui.submit.button').removeClass('loading');
                                $('.ui.recordingEvents.segment').css('display', 'block');
                                //then run the function that enables the buttons
                                enableVerticalMenuButtonsWhenDataAllows();
                        });

                    });
                
            }

        });
    
});