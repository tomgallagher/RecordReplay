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
            //then we need an observable that listens for the creation of new frames
            this.webNavigationObservable = Rx.Observable.fromEventPattern(
                //we add the handler that takes the callback object from the debugger event and passes it to subscribers
                handler => chrome.webNavigation.onCompleted.addListener(handler),
                //we add the handler that removed the handler from the debugger even and reports
                handler => chrome.webNavigation.onCompleted.removeListener(handler)
            );
            //then lets listen to the events as they come in
            this.iframeNavigationObservable = this.webNavigationObservable
                //then we only care about the iframe creation event and we want to ignore the blank ones
                .filter(navigationObject => navigationObject.frameId > 0 && navigationObject.url != "about:blank")
                //then lets' see if we can inject content scripts
                .concatMap(frameObject => Rx.Observable.fromPromise(
                    new Promise(resolve => 
                        chrome.tabs.executeScript(this.browserTabId, 
                            //If true and frameId is set, then the code is inserted in the selected frame and all of its child frames.
                            { code: activeRecording.recordingScriptsString, frameId: frameObject.frameId, runAt: "document_idle" }, 
                            () => { resolve(frameObject); } 
                        )
                    )
                ))
                //then let's see the output
                .subscribe(x => console.log(x));
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
            //any mobile emulation that might be required
            if (activeRecording.recordingIsMobile) {
                await new Promise(resolve => chrome.debugger.sendCommand({ 
                    tabId: this.browserTabId }, 
                    "Emulation.setDeviceMetricsOverride", 
                    { width: 360, height: 640, mobile: true, screenOrientation: activeRecording.recordingMobileOrientation == 'portrait' ? "portraitPrimary" : "landscapePrimary" }, 
                    () => { resolve(); } ));
            }
            //then we need to inject our script string - this may better belong in a function that can be called after webnavigation events
            await new Promise(resolve => 
                chrome.tabs.executeScript(this.browserTabId, 
                    //If true and frameId is set, then the code is inserted in the selected frame and all of its child frames.
                    { code: activeRecording.recordingScriptsString, runAt: "document_idle" }, 
                    () => { resolve(); } 
                )
            );

            

            return this; 

        })();

    }
}