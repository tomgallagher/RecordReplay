function refreshNewTestProjectDropdown() {

    //get the projects data from the database so we can have tests linked to projects
    StorageUtils.getAllObjectsInDatabaseTable('newTest.js', 'projects')
        //once we have the array then we can start populating the new test form projects dropdwon by looping through the array
        .then(projectStorageArray => {

            //filter projects for default by fetching from local storage
            const defaultProjectId = Number(localStorage.getItem("DefaultProject"));
            //if we have any number greater than zero, which indicates no default, then filter
            defaultProjectId > 0 ? projectStorageArray = projectStorageArray.filter(project => project.id == defaultProjectId) : null;

            //get a reference to the drop down in the new test form
            var newTestDropDownMenu = $('.ui.fluid.selection.newTest.project.dropdown .menu');
            //empty the dropdown of existing items
            newTestDropDownMenu.empty();
            //use for-in loop as execution order is maintained to insert all the projects, with references, in the dropdown
            for (let project in projectStorageArray) {     
                //we are not going to use templates here as we are not dealing with complex html structures
                newTestDropDownMenu.append(`<div class="item" data-value=${projectStorageArray[project].id}>${projectStorageArray[project].projectName}</div>`);
            }
            //then after the entire loop has been executed we need to initialise the dropdown with the updated items
            $('.ui.fluid.selection.newTest.project.dropdown').dropdown();

        });  

}

$(document).ready (function(){

    //make all the checkboxes for the new test form ready
    $('.ui.newTestForm.form .ui.checkbox').checkbox({
        onChecked: function() {
            //send data to google analytics so we know how popular the options are
            ga('send', { hitType: 'event', eventCategory: 'TestParams', eventAction: `${$(this).attr('name')}`, eventLabel: 'TestCreationData'});
        }
    });

    //ready the new form bandwidth and latency dropdowns
    $('.ui.newTestForm.form .ui.fluid.selection.bandwidth.dropdown').dropdown();
    $('.ui.newTestForm.form .ui.fluid.selection.latency.dropdown').dropdown();

    $('.ui.newTestForm.form')
        .form({
            on: 'blur',
            fields: {
                testName: {
                    identifier: 'testName',
                    rules: [
                        { type : 'empty', prompt : 'Please enter test name' }
                    ]
                },
                testProjectId: {
                    identifier : 'testProjectId',
                    rules: [
                        { type : 'empty', prompt : 'Please select a project for test' }
                    ]
                },
                testStartUrl: {
                    identifier: 'testStartUrl',
                    rules: [
                        { type : 'empty', prompt : 'Please enter test start url' },
                        { type : 'regExp', value: /(?:^|\s)((https?:\/\/)?(?:localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?(\/\S*)?)/i, prompt : 'Please enter valid test start url' },
                    ]
                },
                testBandwidthValue: {
                    identifier : 'testLatencyValue',
                    rules: [
                        { type : 'empty', prompt : 'Please select a bandwidth value' }
                    ]
                },
                testLatencyValue: {
                    identifier : 'testBandwidthValue',
                    rules: [
                        { type : 'empty', prompt : 'Please select a latency value' }
                    ]
                }
            },
            onSuccess(event, fields) {
                //always need to have this with a submit button otherwise the entire page reloads
                event.preventDefault();
                //add the loading indicator to the button, to indicate saving of the test to the database
                $('.ui.newTestForm .ui.submit.button').addClass('loading');
                //just keep track of field names - they must be the same as model attributes when we create a new class object
                console.log(fields);
                //here we cannot do anything as simple as passing the fields to the model - we need a mix of things and we have to get the right format
                const newTest = new Test({
                    //test name is OK, we just take it straight from fields
                    testName: fields.testName,
                    //test description also comes straight from fields - though not compulsory so it may be defaulted by model
                    testDescription: fields.testDescription || "N/A",
                    //ditto with test author
                    testAuthor: fields.testAuthor || "N/A",
                    //project ID is going to come as a field value from a drop down so it will be a string
                    //we need this as a number, so we can cross-reference easily in the database, use storage utils conversion for now
                    testProjectId: StorageUtils.standardiseKey(fields.testProjectId),
                    //project name is just a string, look up with jquery
                    testProjectName: $('.ui.newTestForm .ui.project.dropdown').dropdown('get text'),
                    //start url is also just a string that we pass straight from fields
                    testStartUrl: fields.testStartUrl,
                    //test bandwidth value is going to come as a field value from a drop down so it will be a string
                    //we need this as a number, so we can input easily into the network emulation in the debugger
                    testBandwidthValue: StorageUtils.standardiseKey(fields.testBandwidthValue),
                    //bandwidth name is just a string, look up with jquery
                    testBandwidthName: $('.ui.newTestForm .ui.bandwidth.dropdown').dropdown('get text'),
                    //test latency value is going to come as a field value from a drop down so it will be a string
                    //we need this as a number, so we can input easily into the network emulation in the debugger
                    testLatencyValue: StorageUtils.standardiseKey(fields.testLatencyValue),
                    //latency name is just a string, look up with jquery
                    testLatencyName: $('.ui.newTestForm .ui.latency.dropdown').dropdown('get text'),
                    //then the checkboxes, which unhelpfully deliver either 'on' string or false boolean - we need to convert all to boolean
                    testPerformanceTimings: fields.testPerformanceTimings == false ? false : true,
                    testResourceLoads: fields.testResourceLoads == false ? false : true,
                    testScreenshot: fields.testScreenShot == false && fields.testVisualRegression == false ? false : true,
                    testVisualRegression: fields.testVisualRegression == false ? false : true,
                });
                //then we need to save to the database
                StorageUtils.addModelObjectToDatabaseTable('newTest.js', newTest, 'tests')
                    //which does not return anything but we don't need it as we fetch from database directly to update the projects table
                    .then( () => {
                        //remove the loading indicator from the button
                        $('.ui.newTestForm .ui.submit.button').removeClass('loading');
                        //clear the form to eliminate any confusion
                        $('.ui.newTestForm.form').form('clear');
                        //then run the function that enables the buttons
                        enableVerticalMenuButtonsWhenDataAllows();
                    });
                
            }

        });

});