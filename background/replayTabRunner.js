class ReplayTabRunner {
    //so we can have incoming replays, named here as activeReplay
    constructor(activeReplay, withLogging) {
        //the use of the anonymous async function in constructor enables us to set up the tab runner with any callback functions and receive responses
        //see https://stackoverflow.com/questions/43431550/async-await-class-constructor

        return (async () => {
            //the first thing we need to do is set the default tab id to zero
            this.browserTabId = 0;
            //then we need to have tab state, so we can close the tab if required and also to prevent operations errors on closed tabs
            this.openState = false;
            //then we need to have tab current url, starting with the activeReplay.recordingTestStartUrl
            this.currentUrl = activeReplay.recordingTestStartUrl;
            //then we need to save the params for the debugger commands from the active replay
            //we need to know the desired latency value
            this.recordingTestLatencyValue = activeReplay.recordingTestLatencyValue;
            //we need to know the desired bandwidth value
            this.recordingTestBandwidthValue = activeReplay.recordingTestBandwidthValue;
            //we need to know if the replay is for mobile
            this.recordingIsMobile = activeReplay.recordingIsMobile;
            //if so, we need to know mobile orientation
            this.recordingMobileOrientation = activeReplay.recordingMobileOrientation;
            //and also the device id
            this.recordingMobileDeviceId = activeReplay.recordingMobileDeviceId;
            //we need the scripts string for injection
            this.injectedScriptString = activeReplay.replayScriptsString;
            //we need to know if the user is saving resource loads
            this.saveResourceLoads = activeReplay.recordingTestResourceLoads;
            //then we see if we're logging or not
            this.withLogging = withLogging;
            //then the replay tab runner collects lots of important information for the replay
            //we need to collect performance timings for the tab, should show important events from the web navigator
            this.performanceTimings = {};
            //we need to collect resource loads for the tab
            this.resourceLoads = {};
            //we need to collect the screenshot for the tab as a data uri
            this.screenShot = '';
            //then we need an instance of the webNavigator class
            this.webNavigator = new WebNavigator();
            //then we need acccess to the messaging
            this.messenger = new RecordReplayMessenger({}).isAsync(true);
            this.incomingMessages = this.messenger.chromeOnMessageObservable.share();
            //then we need access to all the stop messages from the UI
            this.stopProcessingMessageObservable = this.incomingMessages
                //we are filtering here for messages that instruct us to stop the recording
                .filter((msgObject) => msgObject.request.hasOwnProperty('stopNewReplay'))
                //and then we need to send the response as base messaging is async and demands a sent response
                .do((msgObject) =>
                    msgObject.sendResponse({
                        message: `BackgroundJS: Stopping Replay Processes for ${activeReplay.replayRecordingId}`,
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
            const { tabId, pendingUrl, status } = await createTab(activeReplay.recordingTestStartUrl);
            //then report
            console.log(`Replay TabRunner: created new tab for ${pendingUrl} with status ${status}`);
            //and save the tab is locally
            this.browserTabId = tabId;
            //then wait for the tab to load
            await waitForLoad(this.browserTabId);

            //mark the tab as open
            this.openState = true;
            //then we keep track of the time we opened the tab, as a shorthand for page committed which we can miss, for performance timing measurements
            this.openTabTime = Date.now();
            //and we're done - always remember to return this to the constructor in an async function or the whole thing is pointless
            console.log('New Replay Tab Runner created');
            //and we're done - always remember to return this to the constructor in an async function or the whole thing is pointless
            return this;
        })();
    }

    log = (index, message) => {
        //then we just need a list of log statements, add when necessary
        const logStatements = {
            0: 'Replay TabRunner: Debugger Attached',
            1: 'Replay TabRunner: Network Domain Enabled',
            2: 'Replay TabRunner: Page Domain Enabled',
            3: 'Replay TabRunner: Network Conditions Emulated',
            4: 'Replay TabRunner: Mobile Conditions Emulated',
            5: 'Replay TabRunner: Debugger Detached',
            6: 'Replay TabRunner: Curated Page Closed',
            7: `Replay TabRunner: Script Package Injected into main_frame ${message}`,
            8: `Replay TabRunner: Script Package Injected into sub_frame ${message}`,
            9: 'Replay TabRunner: Browser Cache Disabled',
            10: 'Replay TabRunner: Saved Screenshot',
            11: 'Replay TabRunner: Runtime Enabled',
            12: 'Replay TabRunner: Returned Root DOM node',
            13: `Replay TabRunner: Executed QuerySelector: ${message}`,
            14: `Replay TabRunner: Focused Element: ${message}`,
            15: `Replay TabRunner: Dispatched Key Event: ${message}`,
            16: `Replay TabRunner: Dispatched Key Event: ${message}`,
            17: `Replay TabRunner Error: ${message}`,
            18: `Replay TabRunner: Focused Element in Iframe: ${message}`,
            19: `Replay TabRunner: Preparing Screenshot`,
            20: 'Replay TabRunner: Browser Cache Cleared',
        };
        //gives the opportunity to switch off tab runner logging
        if (this.withLogging) {
            if (index === 17) {
                console.warn(logStatements[index]);
            } else {
                console.log(logStatements[index]);
            }
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
            //then we need to update our current url
            .do((navObject) => (this.currentUrl = navObject.url))
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

        //FOREIGN IFRAME SCRIPT INJECTION OBSERVABLE DEFINITION
        const foreignFrameScriptInjectionObservable = this.webNavigator.navigationEventsObservable
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

        //PERFORMANCE TIMINGS OBSERVABLE
        const performanceTimingsObservable = this.webNavigator.navigationEventsObservable
            //we only need to keep processing these events while the tab is open
            .takeUntil(stopObservable)
            //then we only care about events happening in our curated tab
            .filter((navObject) => navObject.tabId == this.browserTabId)
            //then we only care about the main frame
            .filter((navObject) => navObject.frameId == 0)
            //then on each emission we add to our performance timings object
            .do((navObject) => {
                //oddly the navigator returns fractions of a millisecond which we don't care about
                this.performanceTimings[navObject.recordReplayWebNavigationEvent] =
                    Math.round(navObject.timeStamp) || Date.now();
            });

        //RESOURCE LOADS OBSERVABLE CONSTRUCTION

        //LISTEN TO ALL DEBUGGER EVENTS
        const debuggerEventObservable = Rx.Observable.fromEventPattern(
            //add the handler to listen for debugger events
            (handler) => chrome.debugger.onEvent.addListener(handler),
            //remove the handler
            (handler) => chrome.debugger.onEvent.removeListener(handler),
            //send the object with the message and infoobject attached
            (_, message, obj) => ({ message: message, infoObject: obj })
        );

        //LISTEN TO Network.responseReceived EVENTS AS THESE PROVIDE THE RESOURCE TYPE
        const resourceTypeObservable = debuggerEventObservable
            //we only need to keep processing these events while the tab is open
            .takeUntil(stopObservable)
            //to get at the data we use loading finished event
            .filter((networkObject) => networkObject.message == 'Network.responseReceived')
            //then down stream we only need the following params
            .map((networkObject) => ({
                requestId: networkObject.infoObject.requestId,
                resourceType: networkObject.infoObject.type.toLowerCase(),
            }))
            //then we just need this observable to produce a lookup object so we can match the request id to a type
            .scan((lookupObject, value) => {
                //the key is the request ID as well so we can link data sizes with resource categories
                lookupObject[value.requestId] = value.resourceType;
                //return the object for the next scan
                return lookupObject;
                //seed with the initial object
            }, {});

        //LISTEN TO Network.loadingFinished EVENTS AS THESE PROVIDE THE RESOURCE LOADS
        const dataUsageObservable = debuggerEventObservable
            //we only need to keep processing these events while the tab is open
            .takeUntil(stopObservable)
            //to get at the data we use loading finished event
            .filter((networkObject) => networkObject.message == 'Network.loadingFinished')
            //then down stream we only need the following params
            .map((networkObject) => ({
                requestId: networkObject.infoObject.requestId,
                encodedDataLength: networkObject.infoObject.encodedDataLength,
            }))
            //then we need the latest from the resource type observable
            .withLatestFrom(resourceTypeObservable, (dataUsage, lookupObject) => {
                //get the type from the lookup object
                const type = lookupObject[dataUsage.requestId];
                //then just add the new resource load to the existing object resource load, or create the load if new
                this.resourceLoads.hasOwnProperty(type)
                    ? (this.resourceLoads[type] += dataUsage.encodedDataLength)
                    : (this.resourceLoads[type] = dataUsage.encodedDataLength);
            });

        //THEN WE NEED A MESSAGE RELAY OBSERVABLE
        //WE CANNOT SEND REPLAY EVENT MESSAGES DIRECTLY FROM USER INTERFACE TO CONTENT SCRIPTS
        const messageRelayObservable = this.incomingMessages
            //we only need to keep processing these events while the tab is open
            .takeUntil(stopObservable)
            //firstly we only care about messages that contain a replay event
            .filter((messageObject) => messageObject.request.hasOwnProperty('replayEvent'))
            //then it is vital that we don't get into some sort of horrendous loop by relaying messages meant to end here
            //the messages that need to go to all content script are all the user events and the assertions, marked as replay events
            .filter(
                (messageObject) =>
                    messageObject.request.replayEvent.recordingEventOrigin == 'User' ||
                    messageObject.request.replayEvent.assertionEventOrigin == 'Replay'
            )
            //but we don't want to send the keyboard events, as they are handled here
            .filter((messageObject) => messageObject.request.replayEvent.recordingEventAction != 'Keyboard')
            //all other events need to be sent to the content scripts and the responses returned to the user interface
            .switchMap(
                (messageObject) =>
                    //this is a promise that sends the message and resolves with a response
                    Rx.Observable.fromPromise(
                        this.messenger.sendContentScriptMessageGetResponse(this.browserTabId, {
                            replayEvent: messageObject.request.replayEvent,
                        })
                    ),
                //then we can work with the incoming user interface message and the response we get from the content script
                (updatedMessageObject, response) => {
                    //we need to deal with the slight structural differences of assertions. which happen because assertions are extensions of recording events that are not actually replayed
                    const origin =
                        updatedMessageObject.request.replayEvent.assertionEventOrigin ||
                        updatedMessageObject.request.replayEvent.recordingEventOrigin;
                    const action =
                        updatedMessageObject.request.replayEvent.assertionEventAction ||
                        updatedMessageObject.request.replayEvent.recordingEventAction;
                    console.log(`Replay Tab Runner Forwarded ${origin} ${action} Message to Content Script`);
                    //all we need to do is forward the response in the same format as we receive it
                    updatedMessageObject.sendResponse({ replayExecution: response.replayExecution });
                }
            );

        //WE NEED A REPORTS OBSERVABLE TO RETURN THE REPORT DATA TO THE USER INTERFACE WHEN IT ASKS FOR IT
        const reportObjectObservable = this.incomingMessages
            //we only need to keep processing these events while the tab is open
            .takeUntil(stopObservable)
            //firstly we only care about messages that are asking for the report object
            .filter((messageObject) => messageObject.request.hasOwnProperty('getReportObject'))
            //then we need a small delay to ensure that, if the last event was a scroll event, we have scrolled to the right place
            .delay(3000)
            //then we take the screenshot in case we need it
            .switchMap(
                () =>
                    //this is a promise that sends the message and resolves with a response
                    Rx.Observable.fromPromise(this.takeScreenshot()),
                //then just return the active recording
                (messageObject) => messageObject
            )
            //then we just send the current report state
            .do((messageObject) => {
                //then we do a small adjustment if we are missing onCommitted, which can happen if we are slow to get going
                this.performanceTimings.hasOwnProperty('onCommitted')
                    ? null
                    : (this.performanceTimings.onCommitted = this.openTabTime);
                //otherwise the report object should just be sent as it
                const reportObject = {
                    performanceTimings: this.performanceTimings,
                    resourceLoads: this.resourceLoads,
                    screenShot: this.screenShot,
                };
                //the get report object is expecting a reply
                messageObject.sendResponse({ reportObject: reportObject });
            });

        //HANDLE THE SPECIFIC REQUESTS FROM THE USER INTERFACE TO CONFIRM PAGE LOAD
        //WE PAIR THE PAGE REPLAY EVENT MESSAGE WITH THE NAVIGATOR OBSERVABLE
        //BY USING COMBINE LATEST, WE ASSESS ON EACH MESSAGE AND EACH PAGE LOAD, MEANING THAT WE ARE AGNOSTIC ABOUT WHICH COMES FIRST
        const navigationConfirmationObservable = Rx.Observable.combineLatest(
            //first we want to listen for all navigation event onComplete events
            this.webNavigator.navigationEventsObservable
                //we only need to keep processing these events while the tab is open
                .takeUntil(stopObservable)
                //then we only care about the onComplete Event
                .filter((navObject) => navObject.recordReplayWebNavigationEvent == 'onCompleted')
                //then we only care about events happening in our curated tab
                .filter((navObject) => navObject.tabId == this.browserTabId)
                //then we only care about the main frame
                .filter((navObject) => navObject.frameId == 0),
            //then we want to listen for all Page events sent from the user interface
            this.incomingMessages
                //we only need to keep processing these events while the tab is open
                .takeUntil(stopObservable)
                //firstly we only care about messages that contain a replay event
                .filter((messageObject) => messageObject.request.hasOwnProperty('replayEvent'))
                //then we only want messages that are specifically navigation messages
                .filter(
                    (messageObject) =>
                        messageObject.request.replayEvent.recordingEventOrigin == 'Browser' &&
                        messageObject.request.replayEvent.recordingEventAction == 'Page'
                )
                //if we have a replay event, then map the message object to the replay event only and attach the sendResponse so we can return feedback as soon as we get it
                .map((messageObject) => {
                    //we need to extract the replay event coming in from the message object
                    let replayEvent = messageObject.request.replayEvent;
                    //we need to attach the sendResponse callback to the replay event
                    replayEvent.sendResponse = messageObject.sendResponse;
                    //then return the replay event
                    return replayEvent;
                })
        )
            //then we just need to send the response if we have matching events
            .do(([navigationEvent, replayEvent]) => {
                //if we have a match, we need to return the following properties to stay uniform with the main replayer
                //replayExecution.replayEventReplayed, replayExecution.replayEventStatus, replayExecution.replayLogMessages, replayExecution.replayErrorMessages
                if (navigationEvent.url == replayEvent.recordingEventLocationHref) {
                    // we report the time of the pass
                    replayEvent.replayEventReplayed = Date.now();
                    //and we set the status to true to indicate a successful replay
                    replayEvent.replayEventStatus = true;
                    //then create the replay execution log messages array - we don't need to port the exising messages as this is an execution that stands alone
                    replayEvent.replayLogMessages = [`Page Navigation Confirmed`];
                    //first we make a clone of the replay event
                    var replayExecution = Object.assign({}, replayEvent);
                    //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
                    delete replayExecution.sendResponse;
                    //then we send the clean clone
                    replayEvent.sendResponse({ replayExecution: replayExecution });
                }
            });

        //the dom selector reports and focus operations need a record of all the frames to search as well
        //THIS ESSENTIALLY PROVIDES AN EARLY STORE OF ALL THE FRAMES, COULD BE TIMING ISSUES IF FRAME LOADS VERY LATE
        const frameContextObservable = this.webNavigator.navigationEventsObservable
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
            //then get only the frame id
            .map((navObject) => ({ frameId: navObject.frameId, url: navObject.url }))
            //then scan into an array
            .scan((frameIdArray, navObject) => {
                //just push the execution context id into the arra
                frameIdArray.push(navObject);
                //return the array for the next scan
                return frameIdArray;
                //seed with the initial array
            }, []);

        //HANDLE THE SPECIFIC REQUESTS FROM THE USER INTERFACE TO EXECUTE KEYBOARD ACTIONS
        const keyboardObservable = this.incomingMessages
            //we only need to keep processing these events while the tab is open
            .takeUntil(stopObservable)
            //firstly we only care about messages that contain a replay event
            .filter((messageObject) => messageObject.request.hasOwnProperty('replayEvent'))
            //then we only want messages that are specifically keyboard messages
            .filter(
                (messageObject) =>
                    messageObject.request.replayEvent.recordingEventOrigin == 'User' &&
                    messageObject.request.replayEvent.recordingEventAction == 'Keyboard'
            )
            //then we only care about two things - the replay event AND the ability to sendResponse to the message
            .map((msgObject) => {
                //unwrap the two things we want from the message object
                const { sendResponse, request } = msgObject;
                //then unwrap the replay event from the request
                const { replayEvent } = request;
                //we need to attach the sendResponse callback to the replay event
                replayEvent.sendResponse = sendResponse;
                //we need to create new log message and error message arrays as this is an execution and existing messages so not need to be carries forward
                replayEvent.replayLogMessages = [];
                replayEvent.replayErrorMessages = [];
                //then return the replay event
                return replayEvent;
            })
            //and we are good to report the start of the process
            .do((replay) =>
                console.log(
                    `Replay Tab Runner: Work Keyboard ${replay.recordingEventActionType} Event in Keyboard Controls`
                )
            )
            //first thing is to add the iframes to the replay, with default empty array to start
            .withLatestFrom(frameContextObservable.startWith([]), (replayEvent, contextArray) => {
                //just mutate the replay event and return
                replayEvent.iframeContextArray = contextArray;
                return replayEvent;
            })
            .do((x) => console.log(x))
            //and we want to assess the replay event in the context of the selectors
            .flatMap((replay) =>
                Rx.Observable.fromPromise(assessKeyboardSelectors(replay, this.browserTabId, this.currentUrl))
            )
            //then we can filter all those event handlers that return with no selectors
            .filter((replayEvent) => replayEvent.replaySelectorReports.length > 0)
            //then we should prepare focus for the keyboard event
            .flatMap((replay) =>
                Rx.Observable.fromPromise(focusKeyboardEvent(replay, this.browserTabId, this.currentUrl))
            )
            //then we should action the keyboard event
            .flatMap((replay) => Rx.Observable.fromPromise(actionKeyBoardEvent(replay, this.browserTabId)))
            //we need to return the following properties to stay uniform with the main replayer
            //replayExecution.replayEventReplayed, replayExecution.replayEventStatus, replayExecution.replayLogMessages, replayExecution.replayErrorMessages
            .do((replayEvent) => {
                //mark as successful - we report the time of the pass
                replayEvent.replayEventReplayed = Date.now();
                //and we set the status to true to indicate a successful replay
                replayEvent.replayEventStatus = true;
                //then report to the log messages array
                replayEvent.replayLogMessages.push(
                    `${replayEvent.recordingEventActionType.toUpperCase()} Event Playback Confirmed`
                );
                //then send the response
                if (replayEvent.sendResponse != null) {
                    //first we make a clone of this
                    var replayExecution = Object.assign({}, replayEvent);
                    //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
                    delete replayExecution.sendResponse;
                    //then we send the clean clone
                    replayEvent.sendResponse({ replayExecution: replayExecution });
                }
            });

        //our observables need a start action as they are only defined in the handler
        this.startSubscription = Rx.Observable.merge(
            //we need to start the main frame script injection observable
            mainFrameScriptInjectionObservable,
            //then we need to start the sub frame script injection observable
            foreignFrameScriptInjectionObservable,
            //then we need to start the performance timings observable
            performanceTimingsObservable,
            //then we start the reource loads observable
            dataUsageObservable,
            //then the general message relay
            messageRelayObservable,
            //then the general report object
            reportObjectObservable,
            //then we start the navigation confirmation observable
            navigationConfirmationObservable,
            //then we start the keyboard observable
            keyboardObservable
        ).subscribe();
        //then we can just return when we are done
        return;
    };
    //then this is the start command
    run = async () => {
        //then once we have the listeners all set up we try to start the debugger
        try {
            //CHROME REMOTE DEVTOOLS PROTOCOL COMMANDS
            //first we need to attach the debugger so we can send commands
            await attachDebugger(this.browserTabId);
            this.log(0);
            //we need to enable network events
            await enableNetworkEvents(this.browserTabId);
            this.log(1);
            //then we need to clear the cache if we are looking for resource loads
            await clearCache(this.browserTabId);
            this.log(20);
            //then disable the cache if we are looking for accurate statistics
            if (this.saveResourceLoads) {
                await disableCache(this.browserTabId);
                this.log(9);
            }
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
            return 'Active Replay Ready for Replay Event Processing';
        } catch (e) {
            //if this fails we need to return the error message
            console.log(e);
            if (e.includes('Cannot attach to this target')) {
                this.stop();
                return e;
            }
        }
    };

    takeScreenshot = async () => {
        const isAttached = await isDebuggerAttached(this.browserTabId);
        //we will get an error if we try to take screenshot after tab closed
        if (this.openState && isAttached) {
            try {
                const base64image = await takeScreenshot(this.browserTabId);
                //save the string to our class property
                this.screenShot = base64image;
                //log that the screenshot has been taken
                this.log(10);
            } catch (e) {
                this.log(17, e);
            }
        }
        //return so the synthetic promise is resolved
        return;
    };

    stop = async () => {
        const isAttached = await isDebuggerAttached(this.browserTabId);
        //then we need to detach the debugger so we can send commands
        if (this.openState && isAttached) {
            try {
                await detachDebugger(this.browserTabId);
                this.log(5);
            } catch (e) {
                this.log(17, e);
            }
        }
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
