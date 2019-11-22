//simple function to open the user interface
chrome.browserAction.onClicked.addListener(function() { chrome.tabs.create({url: 'index.html'}); });
//handle messages
chrome.runtime.onMessage.addListener(BackgroundMessageListener);
function BackgroundMessageListener(request, sender, sendResponse) {
    switch (true) {
        case request.hasOwnProperty('newRecording'):
            console.log(`Starting new recording tab for Recording ${request.newRecording.id}`);
            sendResponse({message: "BackgroundJs Processing New Recording Request"});
            return true;
        default:
            console.log(`Unrecognised request from ${JSON.stringify(sender)}`);
            console.log(request);
    }
}