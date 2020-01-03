$(document).ready (function(){

    //info popup
    $('.ui.horizontal.compact.menu .link.item').popup({
        popup : $('.ui.flowing.popup'),
        on : 'hover',
        position : 'bottom center',
        hoverable : true,
        delay: { show: 300, hide: 800}
    });

    //github link reporting
    $('.ui.flowing.popup a').on('click', () => ga('send', { hitType: 'event', eventCategory: 'GitHubLink', eventAction: 'Click', eventLabel: 'Github'}));

    //menu operations are not handled automatically by semantic - we handle it ourselves
    $('.ui.compact.horizontal.menu .item').on('click', function() {
        //then get the classes of the active item as a list
        const classArray = $(this).attr('class').split(/\s+/);
        const specialTablesArray = [
            ".ui.vertical.fluid.tabular.menu",
            ".ui.celled.striped.table",
            ".ui.editRecordingRecordingEventsTable",
            ".ui.newRecordingRecordingEventsTable", 
            ".ui.newReplayAssertionsTable", 
            ".ui.newReplayReplayEventsTable", 
            ".ui.showReplayReplayEventsTable", 
            ".ui.runReplayReplayEventsTable",
            ".ui.bulkReplayReplayEventsTable",
        ];
        //then show the segment accordingly
        switch(true) {
            //getting started shows on first load but after it should revert to projects
            case classArray.includes('themeSettings'):
                //check to see if we are predominantly not inverted
                if ($(".ui.inverted").length < 20) { 
                    //if so, then we invert each of our semantic components 
                    $( ".ui" ).addClass( "inverted" );
                    //then we change the background colour
                    $( ".mainSection" ).css( "background-color", "black" );
                    //then we change the vertical menu colour to grey
                    $( specialTablesArray.join(', ') ).removeClass( "violet" );
                    $( specialTablesArray.join(', ') ).addClass( "black" );
                    //then save the marker to local storage on the page
                    localStorage.setItem("ThemeInverted", "true");
                } else {
                    //otherwise we revert each of our semantic components 
                    $( ".ui:not(.violet.submit.button):not(.ui.copyCodeToClipBoard.icon.button)" ).removeClass( "inverted" );
                    //then we change the background colour of the whole project
                    $( ".mainSection" ).css( "background-color", "#fff" );
                    //then we change the vertical menu colour back to violet
                    $( specialTablesArray.join(', ') ).removeClass( "black" );
                    $( specialTablesArray.join(', ') ).addClass( "violet" );
                    //then save the marker to local storage on the page
                    localStorage.setItem("ThemeInverted", "false");
                }
                break;
            case classArray.includes('emailIcon'):
                const emailUrl = "mailto:turbobrowser.contact@gmail.com?Subject=Record/Replay Query";
                ga('send', { hitType: 'event', eventCategory: 'EmailLink', eventAction: 'Click', eventLabel: 'Email'});
                chrome.tabs.create({ url: emailUrl }, function(tab) {
                    setTimeout(function() { chrome.tabs.remove(tab.id); }, 500);
                });
                break;
            case classArray.includes('giveIcon'):
                ga('send', { hitType: 'event', eventCategory: 'DonateLink', eventAction: 'Click', eventLabel: 'Donate'});
                break;
        }
    });

    //then make sure the theme matches on load
    const inverted = localStorage.getItem("ThemeInverted");
    if (inverted == "true") {
        $('.ui.compact.horizontal.menu .themeSettings.item').trigger('click');
    }

}); 