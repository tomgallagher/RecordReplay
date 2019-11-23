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
    .subscribe(x => console.log(x));
