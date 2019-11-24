//simple function to open the user interface
chrome.browserAction.onClicked.addListener(function() { 
    //then we open our user interface tab
    chrome.tabs.create({url: 'index.html'}, function(tab) {
        //this then returns a tab, from which we need to keep track of the tab id
        let recordReplayTabId = tab.id;
        //then we need to activate our background process observables, we stay dormant with no user interface
        var MessageListener = new Messenger().initialise();
        //then we need to add a listener for our user interface closing
        chrome.tabs.onRemoved.addListener(function (tabId){
            //then if the tab id matches the record replay id, we just run our background shutdown processes
            if (tabId == recordReplayTabId) {
                //at the moment all our actions in the background process is started by the message listener so shutting it down should render it inactive
                MessageListener.shutdown();
            }
        });
    }); 
});
