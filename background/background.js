//simple function to open the user interface
chrome.browserAction.onClicked.addListener(function() { chrome.tabs.create({url: 'index.html'}); });
//handle messages
const newRecordingObservable = new RecordReplayMessenger({}).isAsync(true).chromeOnMessageObservable
    //here we only care about messages that are carrying a new recording in their request object
    .filter(messagingObject => messagingObject.request.hasOwnProperty('newRecording'))
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
    //then we want to create an active recording
    .subscribe(x => console.log(x));
