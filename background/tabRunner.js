class TabRunner {

    constructor(recording) {
        //the use of the anonumouse async function in constructor enables us to set up the tab runner with any callback functions and receive responses
        //see https://stackoverflow.com/questions/43431550/async-await-class-constructor
        return (async () => {

            // ALL ASYNC CODE HERE
            //we need to have the browser tab id in the constructor so we can close / listen to the browser tab from the instance of the tab runner
            this.browserTabId = await new Promise(resolve => chrome.tabs.create({ url: recording.recordingTestStartUrl }, (tab) => { resolve(tab.id); } ));
            //then we need to attach the debugger so we can send commands
            await new Promise(resolve => chrome.debugger.attach({ tabId: this.browserTabId }, "1.3", () => { resolve(); } ));
            

            // when done it's important that you return this to the constructor
            return this; 

        })();

    }
}