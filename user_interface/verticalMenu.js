function enableVerticalMenuButtonsWhenDataAllows() {

    //so this function will enable tests when projects > 0, recordings when tests > 0, replays when recordings > 0
    StorageUtils.getRecordsCount()
        //returns an object with the number of entries in each table { projects: <int>, tests: <int>, recordings: <int>, replays: <int> };
        .then(recordsCountObject => {
            //standard switch statement
            switch(true) {
                case recordsCountObject.projects > 0 && recordsCountObject.tests > 0 && recordsCountObject.recordings > 0 && recordsCountObject.replays > 0:
                    //then we want to remove the disabled class from the projects menu item and the new test menu item
                    $('.ui.vertical.fluid.tabular.menu .savedProjects.item').removeClass('disabled');
                    $('.ui.vertical.fluid.tabular.menu .newTest.item').removeClass('disabled');
                    //then we want to remove the disabled class from the tests menu item and the new recording menu item
                    $('.ui.vertical.fluid.tabular.menu .savedTests.item').removeClass('disabled');
                    $('.ui.vertical.fluid.tabular.menu .newRecording.item').removeClass('disabled');
                    //then we want to remove the disabled class from the recordings menu item and the new replay menu item
                    $('.ui.vertical.fluid.tabular.menu .savedRecordings.item').removeClass('disabled');
                    $('.ui.vertical.fluid.tabular.menu .newReplay.item').removeClass('disabled');
                    //then we want to remove the disabled class from the replays menu item and the bulk replay menu item
                    $('.ui.vertical.fluid.tabular.menu .savedReplays.item').removeClass('disabled');
                    $('.ui.vertical.fluid.tabular.menu .bulkReplay.item').removeClass('disabled');
                    //and then we want a break as all the appropriate menu items have been enabled
                    break;
                case recordsCountObject.projects > 0 && recordsCountObject.tests > 0 && recordsCountObject.recordings > 0:
                    //then we want to remove the disabled class from the projects menu item and the new test menu item
                    $('.ui.vertical.fluid.tabular.menu .savedProjects.item').removeClass('disabled');
                    $('.ui.vertical.fluid.tabular.menu .newTest.item').removeClass('disabled');
                    //then we want to remove the disabled class from the tests menu item and the new recording menu item
                    $('.ui.vertical.fluid.tabular.menu .savedTests.item').removeClass('disabled');
                    $('.ui.vertical.fluid.tabular.menu .newRecording.item').removeClass('disabled');
                    //then we want to remove the disabled class from the recordings menu item and the new replay menu item
                    $('.ui.vertical.fluid.tabular.menu .savedRecordings.item').removeClass('disabled');
                    $('.ui.vertical.fluid.tabular.menu .newReplay.item').removeClass('disabled');
                    break;
                case recordsCountObject.projects > 0 && recordsCountObject.tests > 0:
                    //then we want to remove the disabled class from the projects menu item and the new test menu item
                    $('.ui.vertical.fluid.tabular.menu .savedProjects.item').removeClass('disabled');
                    $('.ui.vertical.fluid.tabular.menu .newTest.item').removeClass('disabled');
                    //then we want to remove the disabled class from the tests menu item and the new recording menu item
                    $('.ui.vertical.fluid.tabular.menu .savedTests.item').removeClass('disabled');
                    $('.ui.vertical.fluid.tabular.menu .newRecording.item').removeClass('disabled');
                    break;
                case recordsCountObject.projects > 0:
                    //then we want to remove the disabled class from the projects menu item and the new test menu item
                    $('.ui.vertical.fluid.tabular.menu .savedProjects.item').removeClass('disabled');
                    $('.ui.vertical.fluid.tabular.menu .newTest.item').removeClass('disabled');
                    break;
                default:
                    //this is the case where no record have been added
                    console.log('enableVerticalMenuButtonsWhenDataAllows: No Projects Created Yet');
            }
        });

}

$(document).ready (function(){

    //activate menu buttons according to record counts
    enableVerticalMenuButtonsWhenDataAllows();

    //menu operations are not handled automatically by semantic - we handle it ourselves
    $('.ui.vertical.fluid.tabular.menu .item').on('click', function() {
        //get the classes of the active item as a list
        const classArray = $(this).attr('class').split(/\s+/);
        //if the button is disabled we don't want anything doing
        if (classArray.includes('disabled')) { return; } 
        //remove the active class from all menu items
        $('.ui.vertical.fluid.tabular.menu .item').removeClass('active');
        //then hide all the segments
        $('.ui.verticalTabMenu.segment').css('display', 'none');
        //then add the active class to the menu item that has been clicked
        $(this).addClass('active');
        //then show the segment accordingly
        switch(true) {
            //getting started shows on first load but after it should revert to projects
            case classArray.includes('gettingStarted'):
                $('.ui.verticalTabMenu.gettingStarted.segment').css('display', 'block');
                break;
            case classArray.includes('savedProjects'):
                //make sure the projects table shows an updated account of the projects in storage, using function from projects.js which adds loading indicator
                updateProjectsTable();
                //then reset the form to the point at which the page loaded, where it has neither a success nor an error state
                $('.ui.editProjectForm.form').removeClass('success');
                $('.ui.editProjectForm.form').removeClass('error');
                //then hide the form in the footer of the table
                $('.editProjectFooter').css("display", "none");
                //then we're finished and ready to show the segment
                $('.ui.verticalTabMenu.savedProjects.segment').css('display', 'block');
                break;
            case classArray.includes('newProject'):
                //show the form to create a new project
                $('.ui.verticalTabMenu.newProject.segment').css('display', 'block');
                //then reset the form to the point at which the page loaded, where it has neither a success nor an error state
                $('.ui.newProjectForm.form').removeClass('success');
                $('.ui.newProjectForm.form').removeClass('error');
                break;
            case classArray.includes('savedTests'):
                //make sure the tests table shows an updated account of the tests in storage, using function from tests.js which adds loading indicator
                updateTestsTable();
                //make sure the edit test project dropdown shows an updated account of the projects in storage, using function from tests.js
                refreshEditTestProjectDropdown();
                //then reset the form to the point at which the page loaded, where it has neither a success nor an error state
                $('.ui.editTestForm.form').removeClass('success');
                $('.ui.editTestForm.form').removeClass('error');
                //then hide the form in the footer of the table
                $('.editTestFooter').css("display", "none");
                //then we're finished and ready to show the segment
                $('.ui.verticalTabMenu.savedTests.segment').css('display', 'block');
                break;
            case classArray.includes('newTest'):
                //make sure the new test project dropdown shows an updated account of the projects in storage, using function from newTest.js
                refreshNewTestProjectDropdown();
                //then reset the form to the point at which the page loaded, where it has neither a success nor an error state
                $('.ui.newTestForm.form').removeClass('success');
                $('.ui.newTestForm.form').removeClass('error');
                //show the form to create a new project
                $('.ui.verticalTabMenu.newTest.segment').css('display', 'block');
                break;
            case classArray.includes('savedRecordings'):
                //make sure the recordings table shows an updated account of the tests in storage, using function from recordings.js which adds loading indicator
                updateRecordingsTable();
                //make sure the edit recording test dropdown shows an updated account of the tests in storage, using function from recordings.js
                refreshEditRecordingTestDropdown()
                //then reset the form to the point at which the page loaded, where it has neither a success nor an error state
                $('.ui.editRecordingForm.form').removeClass('success');
                $('.ui.editRecordingForm.form').removeClass('error');
                //then hide the form in the footer of the table
                $('.editRecordingFooter').css("display", "none");
                //and hide the section with the events and the code
                $('.ui.fluid.showRecording.container').css('display', 'none');
                //and hide the event details form in the table footer
                $('.viewDetailedTableEventsFooter').css("display", "none");
                //then we're finished and ready to show the segment
                $('.ui.verticalTabMenu.savedRecordings.segment').css('display', 'block');
                break;
            case classArray.includes('newRecording'):
                //make sure the new recording test dropdown shows an updated account of the tests in storage, using function from newRecording.js
                refreshNewRecordingTestDropdown();
                //then reset the form to the point at which the page loaded, with neither success or error
                $('.ui.newRecordingForm.form').removeClass('success');
                $('.ui.newRecordingForm.form').removeClass('error');
                //and hide the recording events table
                $('.ui.center.aligned.recordingEvents.segment').css('display', 'none');
                //show the form to create a new recording
                $('.ui.verticalTabMenu.newRecording.segment').css('display', 'block');
                break;
            case classArray.includes('savedReplays'):
                //make sure the replays table shows an updated account of the tests in storage, using function from recordings.js which adds loading indicator
                updateReplaysTable();
                //close the show replay / run replay sections
                $('.ui.fluid.showReplay.container').css('display', 'none');
                //close the run replay replayEvents table
                $('.ui.fluid.runReplay.container').css('display', 'none');
                //then show the replays segment
                $('.ui.verticalTabMenu.savedReplays.segment').css('display', 'block');
                break;
            case classArray.includes('newReplay'):
                //make sure the new recording test dropdown shows an updated account of the tests in storage, using function from newReplay.js
                refreshNewReplayRecordingDropdown();
                //then reset the form to the point at which the page loaded, with neither success or error
                $('.ui.newReplayForm.form').removeClass('success');
                $('.ui.newReplayForm.form').removeClass('error');
                //then hide the element structure block by default
                $('.replayEventTargetStructureDisplay').css('display', 'none');
                //and hide the replay events table
                $('.ui.center.aligned.replayEvents.segment').css('display', 'none');
                //then show the replay segment
                $('.ui.verticalTabMenu.newReplay.segment').css('display', 'block');
                break;
            case classArray.includes('bulkReplay'):
                //clear the dropdown of any lingering choices
                $('.ui.fluid.selection.bulkReplay.test.dropdown').dropdown('clear');
                //make sure the bulk replay test dropdown shows an updated account of the tests in storage, using function from bulkReplay.js
                refreshBulkReplayTestDropdown();
                //disable the buttons until test is selected
                $('.ui.bulkReplay.form .ui.startBulkReplay.positive.button').addClass('disabled');
                $('.ui.bulkReplay.form .ui.stopBulkReplay.negative.button').addClass('disabled');
                //empty the container of bottom attached segments
                $('.ui.bulkReplay.segment').find('DIV.ui.bottom.attached.tab.segment').remove();
                //hide the menu
                $('.ui.top.attached.bulkReplay.tabular.menu').css('visibility', 'hidden');
                //then show the replay segment
                $('.ui.verticalTabMenu.bulkReplay.segment').css('display', 'block');
                break;
            case classArray.includes('file'):
                //clear the file import message
                $('#ImportData textarea').val('');
                //then show the segment
                $('.ui.verticalTabMenu.file.segment').css('display', 'block');
                //make the two forms the same height so we can style the segments
                $('.ui.file.segment .ui.export.form').height($('.ui.file.segment .ui.import.form').height());
                break;
            case classArray.includes('help'):
                $('.ui.verticalTabMenu.help.segment').css('display', 'block');
                break;
            
        }

    });

}); 