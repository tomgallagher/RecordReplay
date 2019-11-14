$(document).ready (function(){

    //make all the dropdowns ready
    $('.ui.dropdown').dropdown();
    //make all the checkboxes ready
    $('.ui.checkbox').checkbox();

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
                testStartUrl: {
                    identifier: 'testStartUrl',
                    rules: [
                        { type : 'empty', prompt : 'Please enter test start url' },
                        { type : 'regExp', value: /(?:^|\s)((https?:\/\/)?(?:localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?(\/\S*)?)/i, prompt : 'Please enter valid test start url' },
                    ]
                },
                testProject: {
                    identifier : 'testProject',
                    rules: [
                        { type : 'empty', prompt : 'Please select a project for test' }
                    ]
                },
                testBandwidth: {
                    identifier : 'testBandwidth',
                    rules: [
                        { type : 'empty', prompt : 'Please select a bandwidth value' }
                    ]
                },
                testLatency: {
                    identifier : 'testLatency',
                    rules: [
                        { type : 'empty', prompt : 'Please select a latency value' }
                    ]
                }
            },
            onSuccess(event, fields) {
                event.preventDefault();
                //add the loading indicator to the button
                $('.ui.newTest.submit.button').addClass('loading');
                //log the fields we are getting from the submit event
                console.log(fields);
                //get the text values of the three new test form dropdowns
                const projectText = $('.ui.newTestForm .ui.project.dropdown').dropdown('get text');
                const bandwidthText = $('.ui.newTestForm .ui.bandwidth.dropdown').dropdown('get text');
                const latencyText = $('.ui.newTestForm .ui.latency.dropdown').dropdown('get text');
                console.log(projectText, bandwidthText, latencyText);
                //TO DO - save test to the database
                
                //remove the loading indicator from the button
                $('.ui.newTest.submit.button').removeClass('loading');
                //clear the form to eliminate any confusion
                $('.ui.newTestForm.form').form('clear');
                //then run the function that enables the buttons
                enableVerticalMenuButtonsWhenDataAllows();
            }
        });

});