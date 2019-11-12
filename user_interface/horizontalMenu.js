$(document).ready (function(){
    //menu operations are not handled automatically by semantic - we handle it ourselves
    $('.ui.stackable.compact.menu .item').on('mousedown', function() {
        //then get the classes of the active item as a list
        const classArray = $(this).attr('class').split(/\s+/);
        //then show the segment accordingly
        switch(true) {
            //getting started shows on first load but after it should revert to projects
            case classArray.includes('themeSettings'):
                //check to see if we are predominantly not inverted
                if ($(".ui.inverted").length == 0) { 
                    //if so, then we invert each of our semantic components 
                    $( ".ui" ).addClass( "inverted" );
                    //then we change the background colour
                    $( ".mainSection" ).css( "background-color", "black" );
                    //then we change the vertical menu colour to grey
                    $( ".ui.vertical.fluid.tabular.menu" ).removeClass( "violet" );
                    $( ".ui.vertical.fluid.tabular.menu" ).addClass( "grey" );
                    //then save the marker to local storage on the page
                    localStorage.setItem("ThemeInverted", "true");
                } else {
                    //otherwise we revert each of our semantic components 
                    $( ".ui" ).removeClass( "inverted" );
                    //then we change the background colour of the whole project
                    $( ".mainSection" ).css( "background-color", "#fff" );
                    //then we change the vertical menu colour back to violet
                    $( ".ui.vertical.fluid.tabular.menu" ).removeClass( "grey" );
                    $( ".ui.vertical.fluid.tabular.menu" ).addClass( "violet" );
                    //then save the marker to local storage on the page
                    localStorage.setItem("ThemeInverted", "false");
                }
                break;
            case classArray.includes('emailIcon'):
                const emailUrl = "mailto:turbobrowser.contact@gmail.com?Subject=Turbo Query";
                chrome.tabs.create({ url: emailUrl }, function(tab) {
                    setTimeout(function() { chrome.tabs.remove(tab.id); }, 500);
                });
                break;
            case classArray.includes('giveIcon'):
                
                break;
        }
    });
}); 