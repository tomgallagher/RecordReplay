class Messenger {

    constructor() {
        
        //we set up a single listening instandce to the messenger class and share that between all our message action observables
        this.baseMessagingObservable = new RecordReplayMessenger({}).isAsync(true).chromeOnMessageObservable.share();
        //new recordings require a response in background scripts to open a tab and establish the test parameters
        this.newRecordingObservable = this.baseMessagingObservable.filter(messagingObject => messagingObject.request.hasOwnProperty('newRecording'));

        //ADD NEW LISTENERS HERE

    }

    initialise = () => {

        //this is where all the work gets done
        //all background script actions only take place as a response to user interface messages
        //ALL MESSAGES ASYNC - YOU MUST SEND A RESPONSE TO AVOID ERRORS

        this.newRecordingActionObservable = this.newRecordingObservable
            //then we can report what we are doing
            .do(msgObject => console.log(`Initialising New Recording Processes for Recording ${msgObject.request.newRecording.id}`))
            //and respond to the caller to let them know the process has started
            .do(msgObject => msgObject.sendResponse({message: `BackgroundJS: Initialising New Recording Processes for Recording ${msgObject.request.newRecording.id}`}))
            //CREATE ACTIVE RECORDING
            //pass in existing recording, then initialise to scrunch injected scripts to string available at recordingScriptsString
            //constructor creates web navigator that can supply all navigation events in the browser as an observable at recordingBrowserWebNavigator.navigationEventsObservable
            //constructor creates record/replay messenger that can send and also supply messages as an observable at recordingBrowserMessenger.chromeOnMessageObservable
            .flatMap(msgObject => Rx.Observable.fromPromise(new ActiveRecording(msgObject.request.newRecording, {recordingID: msgObject.request.newRecording.id}).initialise()))
            //then we need to initialise the tab runner asynchronously and add that to the active recording
            .switchMap(activeRecording => 
                //when we create the tab runner, the new tab page is opened and the current tab id will be available via tabRunner.browserTabId
                //if we want logging from the tab runner we pass true as the second parameter
                Rx.Observable.fromPromise(new TabRunner(activeRecording, true)),
                //then user the projection function to add the tabRunner to the activeRecording
                (updatedActiveRecording, tabRunner) => {
                    //then we just want to allocate the tab runner to the active recording using the default placeholder
                    updatedActiveRecording.recordingBrowserTabRunner = tabRunner;
                    //and we only want the active recording back
                    return updatedActiveRecording;
            })
            //then we start the tabrunner
            .switchMap(activeRecording => 
                //then we want to start the tab runner so all the observables are activated and the Chrome Devtools Protocol commands are issued
                Rx.Observable.fromPromise(activeRecording.recordingBrowserTabRunner.run()),
                //then just return the active recording
                (updatedActiveRecording) => updatedActiveRecording 
            )
            //then we need to start observing web events until we are told to stop
            .switchMap(activeRecording => 
                //we listen to web events that we have the ability to subscribe to via our instance of the web navigator
                activeRecording.recordingBrowserWebNavigator.navigationEventsObservable
                    //we only want to listen to the complete event
                    .filter(navObject => navObject.recordReplayWebNavigationEvent == 'onCompleted')
                    //then we only care about the main frame
                    .filter(navObject => navObject.frameId == 0)
                    //then we only care about events happening in our curated tab
                    .filter(navObject => navObject.tabId == activeRecording.recordingBrowserTabRunner.browserTabId)
                    //then we want to translate that event into a recordingEvent with a format we recognise
                    .map(navObject => new RecordingEvent({
                        //these are the only fields we need to stipulate
                        recordingEventOrigin: 'Browser',
                        recordingEventAction: 'Page',
                        recordingEventActionType: navObject.recordReplayWebNavigationEvent,
                        recordingEventHTMLElement: 'N/A',
                        recordingEventLocation: new URL(activeRecording.recordingTestStartUrl).origin,
                    }))
                    //then each time we get an event that needs to be sent to the user interface
                    .do(recordingEvent => activeRecording.recordingBrowserMessenger.sendMessage({recordingEvent: recordingEvent}))
                    //then we only want to keep processing those messages until we need to stop - we takeUntil() and then use last() to signal the observable has completed
                    .takeUntil(
                        //merge the two sources of potential recording stop commands, either will do
                        Rx.Observable.merge(
                            //we want an observable that listens for commands from the user interface to stop recording - maybe this should filter by recording id too
                            this.baseMessagingObservable
                                //we are filtering here for messages that instruct us to stop the recording
                                .filter(msgObject => msgObject.request.hasOwnProperty('stopNewRecording'))
                                //and then we need to send the response as base messaging is async and demands a sent response
                                .do(msgObject => msgObject.sendResponse({message: `BackgroundJS: Stopping Recording Processes for ${activeRecording.recordingID}`})),
                            //we also want an observable that will listen for the active tab being closed
                            activeRecording.recordingBrowserTabRunner.tabClosedObservable
                                //but this also need to send a message to the user interface so it knows recording has stopped
                                .do(tabID => activeRecording.recordingBrowserMessenger.sendMessage({recordingTabClosed: tabID}))
                        //when we have a finalising event we need to report this
                        ).do(() => console.log("BackgroundJS: User Interface Stop or Tab Close Event Fired: Active Recording Finalised"))
                    )
                    //then we wait until the last recording event emission, which will happen when we get a stop command of some sort
                    .last(),
                //then we just return the finalised activeRecording so we can shut down the tab runner 
                (activeRecording) => activeRecording 
            )
            //then we need to tidy up our various objects
            .switchMap(activeRecording => 
                //then we want to start the tab runner so all the observables are activated and the Chrome Devtools Protocol commands are issued
                Rx.Observable.fromPromise(activeRecording.recordingBrowserTabRunner.stop()),
                //then just return the active recording
                (updatedActiveRecording) => updatedActiveRecording 
            );
            
        
        //then we have all the subscriptions handled in a package
        this.collectedMessagingObservable = Rx.Observable.merge(
            //the new recording observable needs to be added
            this.newRecordingActionObservable

            //ADD NEW LISTENERS HERE


        ).subscribe(x => console.log(x));

        //then return this instance of the class so we can shut down from anywhere
        return this;
        
    }

    shutdown = () => {

        //this ensures no memory leaks from dangling message listeners
        this.collectedMessagingObservable.unsubscribe();

    }

}