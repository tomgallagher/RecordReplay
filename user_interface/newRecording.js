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
    $('.ui.newRecordingForm.form .ui.radio.device.checkbox').on('click', function(event) {
        if (event.target.id == "mobile") {
            $('.ui.newRecordingForm.form .orientation.field').removeClass('disabled');
        } else { 
            $('.ui.newRecordingForm.form .orientation.field').addClass('disabled'); 
        }
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
                            recordingDescription: fields.recordingDescription,
                            recordingAuthor: fields.recordingDescription,
                            recordingIsMobile: fields.mobile == false ? false : true,
                            recordingMobileOrientation: fields.landscape == false ? "portrait" : "landscape",
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
                    });
                
            }

        });
    
});