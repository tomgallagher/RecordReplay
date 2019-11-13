$(document).ready (function(){
    //menu operations are not handled automatically by semantic - we handle it ourselves
    $('.ui.vertical.fluid.tabular.menu .item').on('mousedown', function() {
        //remove the active class from all menu items
        $('.ui.vertical.fluid.tabular.menu .item').removeClass('active');
        //then add the active class to the menu item that has been clicked
        $(this).addClass('active');
        //then hide all the segments
        $('.ui.verticalTabMenu.segment').css('display', 'none');
        //then get the classes of the active item as a list
        const classArray = $(this).attr('class').split(/\s+/);
        //then show the segment accordingly
        switch(true) {
            //getting started shows on first load but after it should revert to projects
            case classArray.includes('gettingStarted'):
                $('.ui.verticalTabMenu.gettingStarted.segment').css('display', 'block');
                break;
            case classArray.includes('savedProjects'):
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
                $('.ui.verticalTabMenu.savedTests.segment').css('display', 'block');
                break;
            case classArray.includes('newTest'):
                //show the form to create a new project
                $('.ui.verticalTabMenu.newTest.segment').css('display', 'block');
                //then reset the form to the point at which the page loaded, where it has neither a success nor an error state
                $('.ui.newTestForm.form').removeClass('success');
                $('.ui.newTestForm.form').removeClass('error');
                break;
            case classArray.includes('help'):
                $('.ui.verticalTabMenu.help.segment').css('display', 'block');
                break;
        }
    });
}); 