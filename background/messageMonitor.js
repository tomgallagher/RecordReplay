class MessageMonitor {
    constructor() {
        //we set up a single listening instandce to the messenger class and share that between all our message action observables
        this.baseMessagingObservable = new RecordReplayMessenger({}).isAsync(true).chromeOnMessageObservable.share();
        //new recordings require a response in background scripts to open a tab and establish the test parameters
        this.newRecordingObservable = this.baseMessagingObservable.filter((messagingObject) =>
            messagingObject.request.hasOwnProperty('newRecording')
        );
        //new recordings require a response in background scripts to open a tab and establish the test parameters
        this.newReplayObservable = this.baseMessagingObservable.filter((messagingObject) =>
            messagingObject.request.hasOwnProperty('newReplay')
        );
    }

    initialise = () => {
        //this is where all the work gets done
        //all background script actions only take place as a response to user interface messages
        //ALL MESSAGES ASYNC - YOU MUST SEND A RESPONSE TO AVOID ERRORS

        this.newRecordingActionObservable = this.newRecordingObservable
            //then we can report what we are doing
            .do((msgObject) =>
                console.log(`Initialising New Recording Processes for Recording ${msgObject.request.newRecording.id}`)
            )
            //CREATE ACTIVE RECORDING
            //pass in existing recording, then initialise to scrunch injected scripts to string available at recordingScriptsString
            //constructor creates web navigator that can supply all navigation events in the browser as an observable at recordingBrowserWebNavigator.navigationEventsObservable
            //constructor creates record/replay messenger that can send and also supply SYNC messages as an observable at recordingBrowserMessenger.chromeOnMessageObservable
            .flatMap((msgObject) =>
                Rx.Observable.fromPromise(
                    new ActiveRecording(msgObject.request.newRecording, {
                        recordingID: msgObject.request.newRecording.id,
                        recordingStartResponse: msgObject.sendResponse,
                    }).initialise()
                )
            )
            //then we need to initialise the tab runner asynchronously and add that to the active recording
            .switchMap(
                (activeRecording) =>
                    //when we create the tab runner, the new tab page is opened and the current tab id will be available via tabRunner.browserTabId
                    //if we want logging from the tab runner we pass true as the second parameter
                    Rx.Observable.fromPromise(new RecordingTabRunner(activeRecording, true)),
                //then user the projection function to add the tabRunner to the activeRecording
                (updatedActiveRecording, tabRunner) => {
                    //then we just want to allocate the tab runner to the active recording using the default placeholder
                    updatedActiveRecording.recordingBrowserTabRunner = tabRunner;
                    //and we only want the active recording back
                    return updatedActiveRecording;
                }
            )
            //then we start the tabrunner
            .switchMap(
                (activeRecording) =>
                    //then we want to start the tab runner so all the observables are activated and the Chrome Devtools Protocol commands are issued
                    Rx.Observable.fromPromise(activeRecording.recordingBrowserTabRunner.run()),
                //then just return the active recording
                (updatedActiveRecording, statusMessage) => {
                    //either way send the message
                    updatedActiveRecording.recordingStartResponse({ message: statusMessage });
                    //then we have to add a marker to prevent the activation of the navigation and stop observables
                    return updatedActiveRecording;
                }
            );

        this.newReplayActionObservable = this.newReplayObservable
            //then we can report what we are doing
            .do((msgObject) =>
                console.log(`Initialising New Replay Processes for Replay ${msgObject.request.newReplay.id}`)
            )
            //the message object need to be transformed into an active replay object with all the items we need for processing the replay in background scripts
            .flatMap((msgObject) =>
                //actveReplay constructor creates record/replay messenger that can send messages
                Rx.Observable.fromPromise(
                    //CREATE ACTIVE REPLAY
                    //first we pass in existing replay from the message object request property
                    //then we add specific id so we can fetch from, and update replay in, storage if required
                    //then we pass in the message sendResponse object so we can respond to the user interface once the tab is set up
                    //then we initialise to scrunch injected scripts to string available at replayScriptsString
                    new ActiveReplay(msgObject.request.newReplay, {
                        replayID: msgObject.request.newReplay.id,
                        replayStartResponse: msgObject.sendResponse,
                    }).initialise()
                )
            )
            //then we need to initialise the tab runner asynchronously and add that to the active recording
            .switchMap(
                (activeReplay) =>
                    //when we create the tab runner, the new tab page is opened and the current tab id will be available via tabRunner.browserTabId
                    //if we want logging from the tab runner we pass true as the second parameter
                    Rx.Observable.fromPromise(new ReplayTabRunner(activeReplay, true)),
                //then user the projection function to add the tabRunner to the activeRecording
                (updatedActiveReplay, tabRunner) => {
                    //then we just want to allocate the tab runner to the active recording using the default placeholder
                    //this replay tab runner has the ability to takeScreenshot() - make sure this is done before the debugger is detached
                    updatedActiveReplay.replayBrowserTabRunner = tabRunner;
                    //and we only want the active recording back
                    return updatedActiveReplay;
                }
            )
            //then we start the tabrunner
            .switchMap(
                (activeReplay) =>
                    //then we want to start the tab runner so all the observables are activated and the Chrome Devtools Protocol commands are issued
                    Rx.Observable.fromPromise(activeReplay.replayBrowserTabRunner.run()),
                (updatedActiveReplay, statusMessage) => {
                    //either way send the message
                    updatedActiveReplay.replayStartResponse({ message: statusMessage });
                    return updatedActiveReplay;
                }
            );

        //then we have all the subscriptions handled in a package
        this.collectedMessagingObservable = Rx.Observable.merge(
            //the new recording observable needs to be added
            this.newRecordingActionObservable,
            //the new recording observable needs to be added
            this.newReplayActionObservable
        ).subscribe((x) => console.log(x));

        //then return this instance of the class so we can shut down from anywhere
        return this;
    };

    shutdown = () => {
        //this ensures no memory leaks from dangling message listeners
        this.collectedMessagingObservable.unsubscribe();
    };
}
