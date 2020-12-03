//simple function to open the user interface
chrome.browserAction.onClicked.addListener(function () {
    //then we open our user interface tab
    chrome.tabs.create({ url: 'index.html' }, function (tab) {
        //this then returns a tab, from which we need to keep track of the tab id
        let recordReplayTabId = tab.id;
        //then we need to activate our background process observables, we stay dormant with no user interface
        var MessageListener = new MessageMonitor().initialise();
        //then we need to add a listener for our user interface closing
        chrome.tabs.onRemoved.addListener(function (tabId) {
            //then if the tab id matches the record replay id, we just run our background shutdown processes
            if (tabId == recordReplayTabId) {
                //at the moment all our actions in the background process is started by the message listener so shutting it down should render it inactive
                MessageListener.shutdown();
            }
        });
    });
});

chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
    if (request.sayHello) {
        console.log(sender);
        console.log(request.sayHello);
        sendResponse({ sayHelloBack: 'Greetings From Extension' });
    }
    if (request.command) {
        switch (request.command) {
            case 'LoadAllProjects':
                StorageUtils.getAllObjectsInDatabaseTable('External WebSite', 'projects').then((projects) =>
                    sendResponse({ projects: projects })
                );
                return true;
            case 'LoadAllTests':
                StorageUtils.getAllObjectsInDatabaseTable('External WebSite', 'tests').then((tests) =>
                    sendResponse({ tests: tests })
                );
                return true;
            case 'LoadAllReplays':
                StorageUtils.getAllObjectsInDatabaseTable('External WebSite', 'replays').then((replays) =>
                    sendResponse({ replays: replays })
                );
                return true;
            default:
                console.log(`Unrecognised Command From External ${request.command}`);
        }
    }
});

//FOR TESTING
/*
let activeTab = 0;

chrome.tabs.create({ url: 'https://test.infkuba.ch/staging/' }, (tab) => {
    activeTab = tab.id;
    console.log(tab);
    setTimeout(() => executeScriptInMainFrame(tab.id, 'console.log("fanny waggle");'), 2000);
});
*/
