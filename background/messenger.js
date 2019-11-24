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

        this.newRecordingActionObservable = this.newRecordingObservable
            //then we can report what we are doing
            .do(messagingObject => console.log(`Initialising New Recording Processes for Recording ${messagingObject.request.newRecording.id}`))
            //and respond to the caller to let them know the process has started
            .do(messagingObject => messagingObject.sendResponse({message: `BackgroundJS: Initialising New Recording Processes for Recording ${messagingObject.request.newRecording.id}`}))
            //then create our active recording object with the variables from the recording as well as those we need for the background script
            .map(messagingObject => new ActiveRecording(messagingObject.request.newRecording))
            //then mutate our active recording to generate the script string that will be required for injection into iframes - this takes about 20ms
            .do(activeRecording => activeRecording.generateScriptString())
            //just make sure we have the string in place - better to wait for a class async function to execute in Rx,js
            .delay(50)

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