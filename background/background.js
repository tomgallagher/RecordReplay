//simple function to open the user interface
chrome.browserAction.onClicked.addListener(function() { 
    //then we open our user interface tab
    chrome.tabs.create({url: 'index.html'}, function(tab) {
        //this then returns a tab, from which we need to keep track of the tab id
        let recordReplayTabId = tab.id;
        //then we need to activate our background process observables, we stay dormant with no user interface
        var MessageListener = new MessageMonitor().initialise();
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

//ONLY FOR TESTING REPLAYER
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    //we only want to listen to replay events 
    if (request.hasOwnProperty('replayEvent')) {
        //send a basic response
        sendResponse({message: "Background Relay Received Replay Event"});
        //then get the index page to make sure we send it back to the right place
        chrome.tabs.query({active: true}, (tabs) => {
            //once we have found our testing page send the incoming replay event back to the page
            chrome.tabs.sendMessage(tabs[0].id, {replayEvent: request.replayEvent}, response => {
                //then we need to check here that the response process is working as expected 
                console.log(response.replayExecution);
            });
        });

    }
      
});
