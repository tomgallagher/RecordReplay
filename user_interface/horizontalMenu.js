$(document).ready (function(){
    //info popup
    $('.ui.stackable.compact.menu .link.item').popup({
        popup : $('.ui.flowing.popup'),
        on : 'hover',
        position : 'bottom center',
        hoverable : true,
        delay: { show: 300, hide: 800}
    });

    //menu operations are not handled automatically by semantic - we handle it ourselves
    $('.ui.stackable.compact.menu .item').on('mousedown', function() {
        //then get the classes of the active item as a list
        const classArray = $(this).attr('class').split(/\s+/);
        //then show the segment accordingly
        switch(true) {
            //getting started shows on first load but after it should revert to projects
            case classArray.includes('themeSettings'):
                //check to see if we are predominantly not inverted
                if ($(".ui.inverted").length < 10) { 
                    //if so, then we invert each of our semantic components 
                    $( ".ui" ).addClass( "inverted" );
                    //then we change the background colour
                    $( ".mainSection" ).css( "background-color", "black" );
                    //then we change the vertical menu colour to grey
                    $( ".ui.vertical.fluid.tabular.menu, .ui.celled.striped.table" ).removeClass( "violet" );
                    $( ".ui.vertical.fluid.tabular.menu, .ui.celled.striped.table" ).addClass( "black" );
                    //then save the marker to local storage on the page
                    localStorage.setItem("ThemeInverted", "true");
                } else {
                    //otherwise we revert each of our semantic components 
                    $( ".ui:not(.violet.submit.button):not(.ui.copyCodeToClipBoard.icon.button)" ).removeClass( "inverted" );
                    //then we change the background colour of the whole project
                    $( ".mainSection" ).css( "background-color", "#fff" );
                    //then we change the vertical menu colour back to violet
                    $( ".ui.vertical.fluid.tabular.menu, .ui.celled.striped.table" ).removeClass( "black" );
                    $( ".ui.vertical.fluid.tabular.menu, .ui.celled.striped.table" ).addClass( "violet" );
                    //then save the marker to local storage on the page
                    localStorage.setItem("ThemeInverted", "false");
                }
                break;
            case classArray.includes('emailIcon'):
                const emailUrl = "mailto:turbobrowser.contact@gmail.com?Subject=Record/Replay Query";
                chrome.tabs.create({ url: emailUrl }, function(tab) {
                    setTimeout(function() { chrome.tabs.remove(tab.id); }, 500);
                });
                break;
            case classArray.includes('giveIcon'):
                
                break;
        }
    });
}); 