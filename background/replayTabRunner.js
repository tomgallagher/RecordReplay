class ReplayTabRunner {

    //so we can have incoming active replays, named here as activeItem
    constructor(activeItem, withLogging) {

        //the use of the anonymous async function in constructor enables us to set up the tab runner with any callback functions and receive responses
        //see https://stackoverflow.com/questions/43431550/async-await-class-constructor

        return (async () => {

            //the first thing we need to do is set the default tab id to zero 
            this.browserTabId = 0;
            //then we need to have tab state
            this.openState = false;
            //then we need to save the params for the debugger commands from the active replay
            //we need to know the desired latency value
            this.recordingTestLatencyValue = activeItem.recordingTestLatencyValue;
            //we need to know the desired bandwidth value 
            this.recordingTestBandwidthValue = activeItem.recordingTestBandwidthValue;
            //we need to know if the replay is for mobile 
            this.recordingIsMobile = activeItem.recordingIsMobile;
            //if so, we need to know mobile orientation
            this.recordingMobileOrientation = activeItem.recordingMobileOrientation;
            //we need the scripts string for injection
            this.injectedScriptString = activeItem.replayScriptsString;
            //we need to know if the user is saving resource loads
            this.saveResourceLoads = activeItem.recordingTestResourceLoads;
            //then we see if we're logging or not
            this.withLogging = withLogging;
            //then we need an instance of the webNavigator class
            this.webNavigator = new WebNavigator();
            //then we need an instance of the messenger class as we will be handling keyboard and navigation messages and sending responses
            this.messengerService = new RecordReplayMessenger({}).isAsync(true);
            //then the replay tab runner collects lots of important information for the replay
            //we need to collect performance timings for the tab, should show important events from the web navigator
            this.performanceTimings = {};
            //we need to collect resource loads for the tab
            this.resourceLoads = {};
            //we need to collect the screenshot for the tab as a data uri
            this.screenShot = "";
            //THIS IS THE MOST IMPORTANT PIECE OF CODE AND THE REASON FOR THE ASYNC CONSTRUCTOR
            //we need to have the browser tab id in the constructor
            this.browserTabId = await new Promise(resolve => chrome.tabs.create({ url: activeItem.recordingTestStartUrl }, tab => { this.openState = true; resolve(tab.id); } ));
            //then we keep track of the time we opened the tab
            this.openTabTime = Date.now();
            //and we also want the tab runner to be able to tell the active recording when its tab has closed and also change its own tab state
            this.tabClosedObservable = Rx.Observable.fromEventPattern(
                handler => chrome.tabs.onRemoved.addListener(handler),
                handler => chrome.tabs.onRemoved.removeListener(handler)
            //this is crucial to keep the independence of our curated tab and also to track our tab state
            ).filter(tabId => tabId == this.browserTabId).do(() => this.openState = false);  

            //and we're done - always remember to return this to the constructor in an async function or the whole thing is pointless
            return this; 

        })();

    }

    log = (index, message) => {
        //then we just need a list of log statements, add when necessary
        const logStatements = {
            0: "TabRunner: Debugger Attached",
            1: "TabRunner: Network Domain Enabled",
            2: "TabRunner: Page Domain Enabled",
            3: "TabRunner: Network Conditions Emulated",
            4: "TabRunner: Mobile Conditions Emulated",
            5: "TabRunner: Debugger Detached",
            6: "TabRunner: Curated Page Closed",
            7: `TabRunner: Script Package Injected into main_frame ${message}`,
            8: `TabRunner: Script Package Injected into sub_frame ${message}`,
            9: "TabRunner: Cleared Browser Cache",
            10: "TabRunner: Saved Screenshot",
            11: "TabRunner: DOM Domain Enabled",
            12: "TabRunner:: Returned Root DOM node",
            13: `TabRunner:: Executed QuerySelector: ${message}`,
            14: `TabRunner:: Focused Element With Id: ${message}`,
            15: `TabRunner:: Dispatched Key Event: ${message}`,
            16: `TabRunner:: Dispatched Key Event: ${message}`,
        };
        //gives the opportunity to switch off tab runner logging
        if (this.withLogging) { console.log(logStatements[index]); }
    } 

    run = async () => {

        //MAIN FRAME SCRIPT INJECTION OBSERVABLE DEFINITION
        const mainFrameScriptInjectionObservable = this.webNavigator.navigationEventsObservable
            //then we only care about the onDOMContentLoaded Event
            .filter(navObject => navObject.recordReplayWebNavigationEvent == 'onDOMContentLoaded')
            //then we only care about events happening in our curated tab
            .filter(navObject => navObject.tabId == this.browserTabId)
            //then we only care about the main frame
            .filter(navObject => navObject.frameId == 0)
            //then we inject our collected string into the page
            .concatMap(navObject => Rx.Observable.fromPromise(
                new Promise(resolve => 
                    chrome.tabs.executeScript(this.browserTabId, 
                        //If true and frameId is set, then the code is inserted in the selected frame and all of its child frames.
                        { code: this.injectedScriptString, runAt: "document_idle" },
                        //log the script injection so we can see what's happening and resolve the promise 
                        () => { this.log(7, navObject.url); resolve(); } 
                    )
                )
            ));

        //IFRAME SCRIPT INJECTION OBSERVABLE DEFINITION
        const subFrameScriptInjectionObservable = this.webNavigator.navigationEventsObservable
            //then we only care about the onCommitted Event
            .filter(navObject => navObject.recordReplayWebNavigationEvent == 'onDOMContentLoaded')
            //then we only care about events happening in our curated tab
            .filter(navObject => navObject.tabId == this.browserTabId)
            //then we only care about any iframes 
            .filter(navObject => navObject.frameId > 0)
            //then we don't care about blank iframes
            .filter(navObject => navObject.url != "about:blank")
            //then we inject our collected string into the page
            .concatMap(navObject => Rx.Observable.fromPromise(
                new Promise(resolve => 
                    chrome.tabs.executeScript(this.browserTabId, 
                        //If true and frameId is set, then the code is inserted in the selected frame and all of its child frames.
                        { code: this.injectedScriptString, frameId: navObject.frameId, runAt: "document_idle" },
                        //log the script injection so we can see what's happening and resolve the promise  
                        () => { this.log(8, navObject.url); resolve(); } 
                    )
                )
            ));
        
        //PERFORMANCE TIMINGS OBSERVABLE
        const performanceTimingsObservable = this.webNavigator.navigationEventsObservable
            //then we only care about events happening in our curated tab
            .filter(navObject => navObject.tabId == this.browserTabId)
            //then we only care about the main frame
            .filter(navObject => navObject.frameId == 0)
            //then on each emission we add to our performance timings object
            .do(navObject => {
                //oddly the navigator returns fractions of a millisecond which we don't care about
                this.performanceTimings[navObject.recordReplayWebNavigationEvent] = Math.round(navObject.timeStamp) || Date.now();
            });
        
        //RESOURCE LOADS OBSERVABLE CONSTRUCTION

        //LISTEN TO ALL DEBUGGER EVENTS
        const networkEventObservable = Rx.Observable.fromEventPattern(
            //add the handler to listen for debugger events
            handler => chrome.debugger.onEvent.addListener(handler),
            //remove the handler
            handler => chrome.debugger.onEvent.removeListener(handler),
            //send the object with the message and infoobject attached
            (_, message, obj) => ({ message: message, infoObject: obj })
        );
        
        //LISTEN TO Network.responseReceived EVENTS AS THESE PROVIDE THE RESOURCE TYPE
        const resourceTypeObservable = networkEventObservable
            //to get at the data we use loading finished event
            .filter(networkObject =>  networkObject.message == "Network.responseReceived")
            //then down stream we only need the following params
            .map(networkObject => ({ requestId: networkObject.infoObject.requestId, resourceType: networkObject.infoObject.type.toLowerCase() }) )
            //then we just need this observable to produce a lookup object so we can match the request id to a type
            .scan((lookupObject, value) => { 
                //the key is the request ID as well so we can link data sizes with resource categories
                lookupObject[value.requestId] = value.resourceType; 
                //return the object for the next scan
                return lookupObject; 
            //seed with the initial object 
            }, {});
        
        //LISTEN TO Network.loadingFinished EVENTS AS THESE PROVIDE THE RESOURCE LOADS
        const dataUsageObservable = networkEventObservable
            //to get at the data we use loading finished event
            .filter(networkObject =>  networkObject.message == "Network.loadingFinished")
            //then down stream we only need the following params
            .map(networkObject => ({requestId: networkObject.infoObject.requestId, encodedDataLength: networkObject.infoObject.encodedDataLength}) )
            //then we need the latest from the resource type observable
            .withLatestFrom(
                resourceTypeObservable,
                (dataUsage, lookupObject) => {
                    //get the type from the lookup object
                    const type = lookupObject[dataUsage.requestId];
                    //then just add the new resource load to the existing object resource load, or create the load if new
                    this.resourceLoads.hasOwnProperty(type) ? this.resourceLoads[type] += dataUsage.encodedDataLength : this.resourceLoads[type] = dataUsage.encodedDataLength;
                }
            );     
        
        //THEN WE NEED A MESSAGE RELAY OBSERVABLE
        //WE CANNOT SEND REPLAY EVENT MESSAGES DIRECTLY FROM USER INTERFACE TO CONTENT SCRIPTS
        const messageRelayObservable = this.messengerService.chromeOnMessageObservable
            //firstly we only care about messages that contain a replay event
            .filter(messageObject => messageObject.request.hasOwnProperty('replayEvent'))
            //then it is vital that we don't get into some sort of horrendous loop by relaying messages meant to end here
            //the messages that need to go to all content script are all the user events and the assertions, marked as replay events
            .filter(messageObject => messageObject.request.replayEvent.recordingEventOrigin == 'User' || messageObject.request.replayEvent.recordingEventOrigin == 'Replay')
            //but we don't want to send the keyboard events, as they are handled here
            .filter(messageObject => messageObject.request.replayEvent.recordingEventAction != 'Keyboard')
            //all other events need to be sent to the content scripts and the responses returned to the user interface
            .switchMap(messageObject =>
                //this is a promise that sends the message and resolves with a response
                Rx.Observable.fromPromise( this.messengerService.sendContentScriptMessageGetResponse(this.browserTabId, {replayEvent: messageObject.request.replayEvent}) ),
                //then we can work with the incoming user interface message and the response we get from the content script 
                (updatedMessageObject, response) => {
                    const origin = updatedMessageObject.request.replayEvent.recordingEventOrigin;
                    const action = updatedMessageObject.request.replayEvent.recordingEventAction;
                    console.log(`Tab Runner Forwarded ${origin} ${action} Message to Content Script`);
                    //all we need to do is forward the response in the same format as we receive it
                    updatedMessageObject.sendResponse({replayExecution: response.replayExecution});
                }
            );
        
        //WE NEED A REPORTS OBSERVABLE TO RETURN THE REPORT DATA TO THE USER INTERFACE WHEN IT ASKS FOR IT
        const reportObjectObservable = this.messengerService.chromeOnMessageObservable
            //firstly we only care about messages that are asking for the report object
            .filter(messageObject => messageObject.request.hasOwnProperty('getReportObject'))
            //then we need a small delay to ensure that, if the last event was a scroll event, we have scrolled to the right place
            .delay(3000)
            //then we take the screenshot in case we need it
            .switchMap(() =>
                //this is a promise that sends the message and resolves with a response
                Rx.Observable.fromPromise( this.takeScreenshot()),
                //then just return the active recording
                (messageObject) => messageObject 
            )
            //then we just send the current report state
            .do(messageObject => {
                //then we do a small adjustment if we are missing onCommitted, which can happen if we are slow to get going
                this.performanceTimings.hasOwnProperty('onCommitted') ? null : this.performanceTimings.onCommitted = this.openTabTime;
                //otherwise the report object should just be sent as it
                const reportObject = { performanceTimings: this.performanceTimings, resourceLoads: this.resourceLoads, screenShot: this.screenShot };
                //the get report object is expecting a reply
                messageObject.sendResponse({reportObject: reportObject})
            });

        //HANDLE THE SPECIFIC REQUESTS FROM THE USER INTERFACE TO CONFIRM PAGE LOAD
        //WE PAIR THE PAGE REPLAY EVENT MESSAGE WITH THE NAVIGATOR OBSERVABLE
        const navigationConfirmationObservable = Rx.Observable.combineLatest(
                //first we want to listen for all navigation event onComplete events
                this.webNavigator.navigationEventsObservable
                    //then we only care about the onComplete Event
                    .filter(navObject => navObject.recordReplayWebNavigationEvent == 'onCompleted')
                    //then we only care about events happening in our curated tab
                    .filter(navObject => navObject.tabId == this.browserTabId)
                    //then we only care about the main frame
                    .filter(navObject => navObject.frameId == 0),
                //then we want to listen for all Page events sent from the user interface
                this.messengerService.chromeOnMessageObservable
                    //firstly we only care about messages that contain a replay event
                    .filter(messageObject => messageObject.request.hasOwnProperty('replayEvent'))
                    //then we only want messages that are specifically navigation messages
                    .filter(messageObject => messageObject.request.replayEvent.recordingEventOrigin == 'Browser' && messageObject.request.replayEvent.recordingEventAction == 'Page')
                    //if we have a replay event, then map the message object to the replay event only and attach the sendResponse so we can return feedback as soon as we get it
                    .map(messageObject => {
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
                    replayEvent.sendResponse({replayExecution: replayExecution});
                }
                
            });
        
        //HANDLE THE SPECIFIC REQUESTS FROM THE USER INTERFACE TO EXECUTE KEYBOARD ACTIONS
        const keyboardObservable = this.messengerService.chromeOnMessageObservable
            //firstly we only care about messages that contain a replay event
            .filter(messageObject => messageObject.request.hasOwnProperty('replayEvent'))
            //then we only want messages that are specifically keyboard messages
            .filter(messageObject => messageObject.request.replayEvent.recordingEventOrigin == 'User' && messageObject.request.replayEvent.recordingEventAction == 'Keyboard')
            //if we have a replay event, then map the message object to the replay event only and attach the sendResponse so we can return feedback as soon as we get it
            .map(messageObject => {
                //we need to extract the replay event coming in from the message object
                let replayEvent = messageObject.request.replayEvent;
                //we need to create new log message and error message arrays as this is an execution and existing messages so not need to be carries forward
                replayEvent.replayLogMessages = [];
                replayEvent.replayErrorMessages = [];
                //we need to attach the sendResponse callback to the replay event
                replayEvent.sendResponse = messageObject.sendResponse;
                //then return the replay event
                return replayEvent;
            })
            //then we want to run the DomSelectorReports, which return a CDP nodeId for searching the document
            .flatMap(replayEvent =>
                Promise.all([
                    DomSelectorReport({key: "CssSelector", selectorString: replayEvent.recordingEventCssSelectorPath, targetHtmlTag: replayEvent.recordingEventHTMLTag, browserTabId: this.browserTabId}),
                    DomSelectorReport({key: "DomPathSelector", selectorString: replayEvent.recordingEventCssDomPath, targetHtmlTag: replayEvent.recordingEventHTMLTag, browserTabId: this.browserTabId}),
                    DomSelectorReport({key: "SimmerSelector", selectorString: replayEvent.recordingEventCssSimmerPath, targetHtmlTag: replayEvent.recordingEventHTMLTag, browserTabId: this.browserTabId})
                ]),
                (replayEvent, selectorResultsArray) => {

                    //see if we have any invalid selector reports
                    replayEvent.failedReplaySelectorReports = selectorResultsArray.filter(report => report.invalidSelector);
                    //if we have invalid selectors then we need to know
                    if (replayEvent.failedReplaySelectorReports.length > 0) {
                        replayEvent.replayErrorMessages.push(replayEvent.failedReplaySelectorReports.map(report => report.warningMessages).join(', '));
                    }
                    //see if we have any valid selector reports, and if we do, we save as the definitive selector reports 
                    replayEvent.replaySelectorReports = selectorResultsArray.filter(report => !report.invalidSelector);
                    //if we have valid selectors then we need to know about which ones remain valid
                    if (replayEvent.replaySelectorReports.length > 0) {
                        replayEvent.replayLogMessages.push(replayEvent.replaySelectorReports.map(report => report.logMessages).join(', '));
                    }

                    //then we need to have an outcome
                    if (replayEvent.replaySelectorReports.length > 0) {
                        //select the first report that has provided a positive response, this will have a nodeId property we need to use again
                        replayEvent.chosenSelectorReport = replayEvent.replaySelectorReports[0];
                    } else {
                        //then we need to push an error message to the logs
                        replayEvent.replayErrorMessages.push(`No Valid Target On Page`);
                        //otherwise we report the time of the fail
                        replayEvent.replayEventReplayed = Date.now();
                        //and we set the status to false to indicate a failed replay
                        replayEvent.replayEventStatus = false;
                        //then send the response if we have the facility
                        if (replayEvent.sendResponse != null) {
                            //first we make a clone of this 
                            var replayExecution = Object.assign({}, replayEvent);
                            //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
                            delete replayExecution.sendResponse;
                            //then we send the clean clone
                            replayEvent.sendResponse({replayExecution: replayExecution});
                        }            
                    }
                    //then return the replay event
                    return replayEvent;
                }
            )
            //then we can filter all those event handlers that return with a state of false
            .filter(replayEvent => replayEvent.replayEventStatus != false)
            //then we need to focus the element
            .flatMap(replayEvent => this.focus(replayEvent) )
            //then we need to run the keydown
            .flatMap(replayEvent => this.keydown(replayEvent) )
            //then we need to run the keyup
            .flatMap(replayEvent => this.keyup(replayEvent) )
            //we need to return the following properties to stay uniform with the main replayer
            //replayExecution.replayEventReplayed, replayExecution.replayEventStatus, replayExecution.replayLogMessages, replayExecution.replayErrorMessages
            .do(replayEvent => {
                //mark as successful - we report the time of the pass
                replayEvent.replayEventReplayed = Date.now();
                //and we set the status to true to indicate a successful replay
                replayEvent.replayEventStatus = true;
                //then report to the log messages array
                replayEvent.replayLogMessages.push(`${replayEvent.actionType.toUpperCase()} Event Playback Confirmed`);
                //then send the response
                if (replayEvent.sendResponse != null) {
                    //first we make a clone of this 
                    var replayExecution = Object.assign({}, replayEvent);
                    //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
                    delete replayExecution.sendResponse;
                    //then we send the clean clone
                    replayEvent.sendResponse({replayExecution: replayExecution});
                }   
            })


        //CHROME REMOTE DEVTOOLS PROTOCOL COMMANDS
        //then we need to attach the debugger so we can send commands
        await new Promise(resolve => chrome.debugger.attach({ tabId: this.browserTabId }, "1.3", () => { this.log(0); resolve(); } ));
        //then we need to listen to network events, passing in an empty object as we have no need to fine-tune
        await new Promise(resolve => chrome.debugger.sendCommand({ tabId: this.browserTabId }, "Network.enable", {}, () => { this.log(1); resolve(); } ));
        //then we need to clear the cache if we are looking for resource loads
        //this can take quite a long time on the first time it's cleared, so we don't wait for it
        if (this.saveResourceLoads) { chrome.debugger.sendCommand({ tabId: this.browserTabId }, "Network.clearBrowserCache", {}, () => { this.log(9); }); }
        //then we need to have the ability to send page commands
        await new Promise(resolve => chrome.debugger.sendCommand({ tabId: this.browserTabId }, "Page.enable", {}, () => { this.log(2); resolve(); } ));
        //then we need to have the ability to send DOM commands
        await new Promise(resolve => chrome.debugger.sendCommand({ tabId: this.browserTabId }, "DOM.enable", {}, () => { this.log(11); resolve(); } ));
        //then we need to set any throttling / latency that may be needed
        await new Promise(resolve => chrome.debugger.sendCommand(
            { tabId: this.browserTabId }, 
            "Network.emulateNetworkConditions", 
            { 
                offline: false, 
                latency: this.recordingTestLatencyValue, 
                downloadThroughput: this.recordingTestBandwidthValue, 
                uploadThroughput: this.recordingTestBandwidthValue
            }, 
            () => { this.log(3); resolve(); } 
        ));
        //any mobile emulation that might be required
        if (this.recordingIsMobile) await new Promise(resolve => 
            chrome.debugger.sendCommand({ 
                tabId: this.browserTabId }, 
                "Emulation.setDeviceMetricsOverride", 
                { 
                    width: 360, 
                    height: 640, 
                    mobile: true, 
                    screenOrientation: this.recordingMobileOrientation == 'portrait' ? "portraitPrimary" : "landscapePrimary" 
                }, 
                () => { this.log(4); resolve(); } 
            ));

        //our observables need a start action as they are only defined in the handler
        this.startSubscription = Rx.Observable.merge(
            //we need to start the main frame script injection observable
            mainFrameScriptInjectionObservable,
            //then we need to start the sub frame script injection observable
            subFrameScriptInjectionObservable,
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
        //return so the synthetic promise is resolved
        return;

    }

    focus = async (replayEvent) => {

        //when we ran the dom selector reports, this generated a nodeId on success
        const targetNodeId = replayEvent.chosenSelectorReport.nodeId;
        //then we need to focus on the element which will allow us to start sending key commands
        await new Promise(resolve => chrome.debugger.sendCommand({ tabId: this.browserTabId }, "DOM.focus", { nodeId: targetNodeId }, () => { this.log(14, targetNodeId); resolve(); } ));
        //then return the replay event for further processing 
        return replayEvent;

    }

    keydown = async (replayEvent) => {

        //when we recorded the event, we created an event object matching the CDP required params
        const event = replayEvent.recordingEventDispatchKeyEvent;
        //essentially here it is a choice between "keyDown" or "rawKeyDown" for type in replayEvent.recordingEventDispatchKeyEvent
        await new Promise(resolve => chrome.debugger.sendCommand({ tabId: this.browserTabId }, "Input.dispatchKeyEvent", event, () => { this.log(15, event.type); resolve(); } ));
        //then return the replay event for further processing 
        return replayEvent;

    }

    keyup = async (replayEvent) => {

        //when we recorded the event, we created an event object matching the CDP required params
        let event = replayEvent.recordingEventDispatchKeyEvent;
        //the type needs to be changed from "keyDown" or "rawKeyDown" to "keyup"
        event.type = "keyUp";
        await new Promise(resolve => chrome.debugger.sendCommand({ tabId: this.browserTabId }, "Input.dispatchKeyEvent", event, () => { this.log(16, event.type); resolve(); } ));
        //then return the replay event for further processing 
        return replayEvent;

    }

    takeScreenshot = async () => {

        //we instruct the debugger to take the screenshot with a wrapped promise
        await new Promise(resolve => {
            //we will get an error if we try to take screenshot after tab closed
            if (this.openState) {
                //send the command to the debugger
                chrome.debugger.sendCommand(
                    //always use our tab ID
                    { tabId: this.browserTabId },
                    //send the screenshot command 
                    "Page.captureScreenshot", 
                    //then the image params
                    { format: "jpeg", quality: 100 },
                    //this returns string of Base64-encoded image data
                    data => { 
                        //save the string to our class property
                        this.screenShot = data;
                        //log that the screenshot has been taken
                        this.log(10); 
                        //then resolve
                        resolve(); 
                    } 
                );
            //if the tab is closed we just resolve and do not update the screenshot property
            } else { resolve(); }
        });
        //return so the synthetic promise is resolved
        return;

    }

    stop = async () => {

        //then we need to detach the debugger so we can send commands
        if (this.openState) await new Promise(resolve => chrome.debugger.detach({ tabId: this.browserTabId }, () => { this.log(5); resolve(); } ));
        //then we need to close our curated tab
        if (this.openState) await new Promise(resolve => chrome.tabs.remove(this.browserTabId, () => { this.log(6); resolve(); } ));
        this.startSubscription.unsubscribe();
        //return so the synthetic promise is resolved
        return;

    }
    
}