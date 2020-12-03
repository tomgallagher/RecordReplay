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
            //then we need acccess to the messaging
            this.messenger = new RecordReplayMessenger({}).isAsync(true);
            this.incomingMessages = this.messenger.chromeOnMessageObservable.share();
            //then we need access to all the stop messages from the UI
            this.stopProcessingMessageObservable = this.incomingMessages
                .filter((msgObject) => msgObject.request.hasOwnProperty('stopNewRecording'))
                //and then we need to send the response as base messaging is async and demands a sent response
                .do((msgObject) =>
                    msgObject.sendResponse({
                        message: `BackgroundJS: Stopping Recording Processes for ${activeRecording.recordingID}`,
                    })
                );
            //and all the tab closed events which are equivalent to stop messages
            this.tabClosedObservable = Rx.Observable.fromEventPattern(
                (handler) => chrome.tabs.onRemoved.addListener(handler),
                (handler) => chrome.tabs.onRemoved.removeListener(handler)
                //this is crucial to keep the independence of our curated tab and also to track our tab state
            )
                .filter((tabId) => tabId == this.browserTabId)
                .do(() => (this.openState = false));

            //we need to set up all of our listeners before we open the tab - we need data about the page load
            await this.setUpListeners();
            //THIS IS THE MOST IMPORTANT PIECE OF CODE AND THE REASON FOR THE ASYNC CONSTRUCTOR
            //first we create the tab and get all the information about it
            const { tabId, pendingUrl, status } = await createTab(activeRecording.recordingTestStartUrl);
            //then report
            console.log(`Recording TabRunner: created new tab for ${pendingUrl} with status ${status}`);
            //and save the tab is locally
            this.browserTabId = tabId;
            //then wait for the tab to load
            await waitForLoad(this.browserTabId);
            //then adjust the open state
            this.openState = true;
            //and we're done - always remember to return this to the constructor in an async function or the whole thing is pointless
            console.log('New Recording Tab Runner created');
            return this;
        })();
    }

    log = (index, message) => {
        //then we just need a list of log statements, add when necessary
        const logStatements = {
            0: 'Recording TabRunner: Debugger Attached',
            1: 'Recording TabRunner: Network Domain Enabled',
            2: 'Recording TabRunner: Page Domain Enabled',
            3: 'Recording TabRunner: Network Conditions Emulated',
            4: 'Recording TabRunner: Mobile Conditions Emulated',
            5: 'Recording TabRunner: Debugger Detached',
            6: 'Recording TabRunner: Curated Page Closed',
            7: `Recording TabRunner: Script Package Injected into main_frame ${message}`,
            8: `Recording TabRunner: Script Package Injected into sub_frame ${message}`,
            9: `Recording TabRunner Error: ${message}`,
        };
        //gives the opportunity to switch off tab runner logging
        if (this.withLogging) {
            console.log(logStatements[index]);
        }
    };

    setUpListeners = async () => {
        //this is when we need to stop all processing
        const stopObservable = Rx.Observable.merge(this.stopProcessingMessageObservable, this.tabClosedObservable)
            //we only need to stop it once
            .take(1)
            //then call the function to stop the debugger and close the tab
            .do(() => this.stop())
            //and share between many with the one call to stop
            .share();

        //MAIN FRAME SCRIPT INJECTION OBSERVABLE DEFINITION
        const mainFrameScriptInjectionObservable = this.webNavigator.navigationEventsObservable
            //we only need to keep processing these events while the tab is open
            .takeUntil(stopObservable)
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
            //we only need to keep processing these events while the tab is open
            .takeUntil(stopObservable)
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

        //then we need to have a routine that listens to the navigator and returns page navigation events to the UI
        const pageNavigationEventObservable = this.webNavigator.navigationEventsObservable
            //we only need to keep processing these events while the tab is open
            .takeUntil(stopObservable)
            //we only want to listen to the complete event
            .filter((navObject) => navObject.recordReplayWebNavigationEvent == 'onCompleted')
            //then we only care about the main frame
            .filter((navObject) => navObject.frameId == 0)
            //then we only care about events happening in our curated tab
            .filter((navObject) => navObject.tabId == this.browserTabId)
            //then we want to translate that event into a recordingEvent with a format we recognise
            .map(
                (navObject) =>
                    new RecordingEvent({
                        //these are the only fields we need to stipulate
                        recordingEventOrigin: 'Browser',
                        recordingEventAction: 'Page',
                        recordingEventActionType: navObject.recordReplayWebNavigationEvent,
                        recordingEventHTMLElement: 'N/A',
                        recordingEventLocation: new URL(navObject.url).origin,
                        recordingEventLocationHref: navObject.url,
                    })
            )
            .do((ev) => console.log(ev))
            //then we need a small delay for the first page emission to give the user interface time to make the connection
            .delay(200)
            //then each time we get an event that needs to be sent to the user interface
            .switchMap(
                (ev) => this.messenger.sendMessageGetResponse({ recordingEvent: ev }),
                (event) => event
            );

        //our observables need a start action as they are only defined in the handler
        this.startSubscription = Rx.Observable.merge(
            //we need to start the main frame script injection observable
            mainFrameScriptInjectionObservable,
            //then we need to start the sub frame script injection observable
            subFrameScriptInjectionObservable,
            //then the page event observable
            pageNavigationEventObservable
        ).subscribe();

        return;
    };

    run = async () => {
        //then once we have the listeners all set up we try to start the debugger
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
            //return so the synthetic promise is resolved
            return 'Active Recording Ready for Recording Events';
        } catch (e) {
            //if this fails we need to return the error message
            console.log(e);
            if (e.includes('Cannot attach to this target')) {
                this.stop();
                return e;
            }
        }
    };

    stop = async () => {
        const isAttached = await isDebuggerAttached(this.browserTabId);
        //then we need to detach the debugger so we can send commands
        if (this.openState && isAttached)
            await new Promise((resolve) =>
                chrome.debugger.detach({ tabId: this.browserTabId }, () => {
                    if (chrome.runtime.lastError) {
                        console.log(chrome.runtime.lastError.message);
                    }
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
        //and kill all the merged observables, if they have been activated, at one stroke to enable clean shut down
        if (this.startSubscription) this.startSubscription.unsubscribe();
        //return so the synthetic promise is resolved
        return this.browserTabId;
    };
}
