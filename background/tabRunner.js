class TabRunner {

    constructor(activeRecording) {
        //the use of the anonumouse async function in constructor enables us to set up the tab runner with any callback functions and receive responses
        //see https://stackoverflow.com/questions/43431550/async-await-class-constructor
        return (async () => {

            // ALL ASYNC CODE HERE
            //we need to have the browser tab id in the constructor so we can close / listen to the browser tab from the instance of the tab runner
            this.browserTabId = await new Promise(resolve => chrome.tabs.create({ url: activeRecording.recordingTestStartUrl }, tab => { resolve(tab.id); } ));
            //then we need to attach the debugger so we can send commands
            await new Promise(resolve => chrome.debugger.attach({ tabId: this.browserTabId }, "1.3", () => { resolve(); } ));
            //then we need to listen to network events, passing in an empty object as we have no need to fine-tune
            await new Promise(resolve => chrome.debugger.sendCommand({ tabId: this.browserTabId }, "Network.enable", {}, () => { resolve(); } ));
            //then we need to listen to page events
            await new Promise(resolve => chrome.debugger.sendCommand({ tabId: this.browserTabId }, "Page.enable", {}, () => { resolve(); } ));
            //then we need to set any throttling / latency that may be needed
            await new Promise(resolve => chrome.debugger.sendCommand(
                { tabId: this.browserTabId }, 
                "Network.emulateNetworkConditions", 
                { offline: false, latency: activeRecording.recordingTestLatencyValue, downloadThroughput: activeRecording.recordingTestBandwidthValue, uploadThroughput: activeRecording.recordingTestBandwidthValue}, 
                () => { resolve(); } 
            ));
            
            //TO DO - any mobile emulation that might be required

            
            //TO DO - we need to wait for the page to have loaded, so all iframes are present and correct

            //then we need to inject our script string
            await new Promise(resolve => 
                chrome.tabs.executeScript(this.browserTabId, 
                    //If true and frameId is set, then the code is inserted in the selected frame and all of its child frames.
                    { code: activeRecording.recordingScriptsString, allFrames: true, frameId: 0, runAt: "document_idle" }, 
                    () => { resolve(); } 
                )
            );
            
            return this; 

        })();

    }
}