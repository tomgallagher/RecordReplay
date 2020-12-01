class RecordingTabRunner {
    constructor(activeRecording, withLogging) {
        //the use of the anonymous async function in constructor enables us to set up the tab runner with any callback functions and receive responses
        //see https://stackoverflow.com/questions/43431550/async-await-class-constructor

        return (async () => {
            //the first thing we need to do is set the default tab id to zero
            this.browserTabId = 0;
            //then we need to have tab state
            this.openState = false;
            //then we need to save the params for the debugger commands from the active recording
            this.recordingTestLatencyValue = activeRecording.recordingTestLatencyValue;
            this.recordingTestBandwidthValue = activeRecording.recordingTestBandwidthValue;
            this.recordingIsMobile = activeRecording.recordingIsMobile;
            this.recordingMobileDeviceId = activeRecording.recordingMobileDeviceId;
            this.recordingMobileOrientation = activeRecording.recordingMobileOrientation;
            this.injectedScriptString = activeRecording.recordingScriptsString;
            //then we see if we're logging or not
            this.withLogging = withLogging;
            //then we need an instance of the webNavigator class
            this.webNavigator = new WebNavigator();
            //THIS IS THE MOST IMPORTANT PIECE OF CODE AND THE REASON FOR THE ASYNC CONSTRUCTOR
            //we need to have the browser tab id in the constructor
            this.browserTabId = await new Promise((resolve) =>
                chrome.tabs.create({ url: activeRecording.recordingTestStartUrl }, (tab) => {
                    this.openState = true;
                    setTimeout(() => {
                        console.log('TabRunner: Browser Tab Open');
                        resolve(tab.id);
                    }, 1000);
                })
            );
            //and we also want the tab runner to be able to tell the active recording when its tab has closed and also change its own tab state
            this.tabClosedObservable = Rx.Observable.fromEventPattern(
                (handler) => chrome.tabs.onRemoved.addListener(handler),
                (handler) => chrome.tabs.onRemoved.removeListener(handler)
                //this is crucial to keep the independence of our curated tab and also to track our tab state
            )
                .filter((tabId) => tabId == this.browserTabId)
                .do(() => (this.openState = false));
            //and we're done - always remember to return this to the constructor in an async function or the whole thing is pointless
            return this;
        })();
    }

    log = (index, message) => {
        //then we just need a list of log statements, add when necessary
        const logStatements = {
            0: 'TabRunner: Debugger Attached',
            1: 'TabRunner: Network Domain Enabled',
            2: 'TabRunner: Page Domain Enabled',
            3: 'TabRunner: Network Conditions Emulated',
            4: 'TabRunner: Mobile Conditions Emulated',
            5: 'TabRunner: Debugger Detached',
            6: 'TabRunner: Curated Page Closed',
            7: `TabRunner: Script Package Injected into main_frame ${message}`,
            8: `TabRunner: Script Package Injected into sub_frame ${message}`,
            9: `TabRunner Error: ${message}`,
        };
        //gives the opportunity to switch off tab runner logging
        if (this.withLogging) {
            console.log(logStatements[index]);
        }
    };

    run = async () => {
        //MAIN FRAME SCRIPT INJECTION OBSERVABLE DEFINITION
        const mainFrameScriptInjectionObservable = this.webNavigator.navigationEventsObservable
            //then we only care about the onDOMContentLoaded Event
            .filter((navObject) => navObject.recordReplayWebNavigationEvent == 'onDOMContentLoaded')
            //then we only care about events happening in our curated tab
            .filter((navObject) => navObject.tabId == this.browserTabId)
            //then we only care about the main frame
            .filter((navObject) => navObject.frameId == 0)
            //then we inject our collected string into the page
            .concatMap((navObject) =>
                Rx.Observable.fromPromise(
                    new Promise((resolve) =>
                        chrome.tabs.executeScript(
                            this.browserTabId,
                            //If allFrames true and frameId is set, then the code is inserted in the selected frame and all of its child frames
                            //THIS ONLY INCLUDES VANILLA IFRAMES - FOR CROSS ORIGIN IFRAMES WE NEED TO HAVE THE SEPARATE ROUTINE BELOW
                            {
                                code: this.injectedScriptString,
                                allFrames: true,
                                frameId: navObject.frameId,
                                runAt: 'document_idle',
                            },
                            //log the script injection so we can see what's happening and resolve the promise
                            () => {
                                this.log(7, navObject.url);
                                resolve();
                            }
                        )
                    )
                )
            );

        //IFRAME SCRIPT INJECTION OBSERVABLE DEFINITION
        const subFrameScriptInjectionObservable = this.webNavigator.navigationEventsObservable
            //then we only care about the onCommitted Event
            .filter((navObject) => navObject.recordReplayWebNavigationEvent == 'onDOMContentLoaded')
            //then we only care about events happening in our curated tab
            .filter((navObject) => navObject.tabId == this.browserTabId)
            //then we only care about any iframes
            .filter((navObject) => navObject.frameId > 0)
            //then we don't care about blank iframes
            .filter((navObject) => navObject.url != 'about:blank')
            //then we inject our collected string into the page
            .concatMap((navObject) =>
                Rx.Observable.fromPromise(
                    new Promise((resolve) =>
                        chrome.tabs.executeScript(
                            this.browserTabId,
                            //THIS WILL ONLY INJECT INTO CROSS ORIGIN IFRAMES AS THERE WILL BE NO NAVIGATION EVENT FOR SAME DOMAIN FRAMES
                            { code: this.injectedScriptString, frameId: navObject.frameId, runAt: 'document_idle' },
                            //log the script injection so we can see what's happening and resolve the promise
                            () => {
                                this.log(8, navObject.url);
                                resolve();
                            }
                        )
                    )
                )
            );

        //CHROME REMOTE DEVTOOLS PROTOCOL COMMANDS
        //then we need to attach the debugger so we can send commands
        try {
            //first we need to attach the debugger so we can send commands
            await attachDebugger(this.browserTabId);
            this.log(0);
            //we need to enable network events
            await enableNetworkEvents(this.browserTabId);
            this.log(1);
            //then we need to enable the page events
            await enablePageEvents(this.browserTabId);
            this.log(2);
            //then set the eumlated network conditions
            await setNetworkConditions(
                this.browserTabId,
                this.recordingTestLatencyValue,
                this.recordingTestBandwidthValue,
                this.recordingTestBandwidthValue
            );
            this.log(3);
            if (this.recordingIsMobile) {
                await emulateDevice(this.recordingMobileDeviceId, this.recordingMobileOrientation);
                this.log(4);
            }
        } catch (e) {
            //then no point in carrying on if we are not attached
            this.log(9, e);
        }
        //our observables need a start action as they are only defined in the handler
        this.startSubscription = Rx.Observable.merge(
            //we need to start the main frame script injection observable
            mainFrameScriptInjectionObservable,
            //then we need to start the sub frame script injection observable
            subFrameScriptInjectionObservable
        ).subscribe();
        //return so the synthetic promise is resolved
        return;
    };

    stop = async () => {
        //then we need to detach the debugger so we can send commands
        if (this.openState && isDebuggerAttached(this.browserTabId))
            await new Promise((resolve) =>
                chrome.debugger.detach({ tabId: this.browserTabId }, () => {
                    this.log(5);
                    resolve();
                })
            );
        //then we need to close our curated tab
        if (this.openState)
            await new Promise((resolve) =>
                chrome.tabs.remove(this.browserTabId, () => {
                    this.log(6);
                    resolve();
                })
            );
        //we need to stop the observables to prevent memory leaks
        this.startSubscription.unsubscribe();
        //return so the synthetic promise is resolved
        return;
    };
}
