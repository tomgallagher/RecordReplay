class RecordReplayMessenger {

    //pass in an options object
    constructor(options) {

        // set default values for the keycodes class 
        const defaults = {
            //all recording messengers must be initialised to create the incoming message observable that can be subscribed
            incomingMessageObservable: null,
            //then we say the kind of message constructor we are interested in
            constructorFilter: "N/A",
            //all messengers need the ability to detect if they are in an iframe
            contextIsIframe: () => { 
                try { return window.self !== window.top; } 
                catch (e) { return true; } 
            },
            //all messengers need the ability to detect if they are in a content script
            contextIsContentScript: () => { return typeof chrome.runtime.getManifest != 'undefined' },
            //then we need a function that logs accordint to context
            logWithContext: message => {
                this.contextIsIframe() ? console.log(`%c${message} [iframe]`, 'color: green') : null;
                this.contextIsContentScript() ? console.log(`%c${message} [contentscript]`, 'color: blue'): null;
            }
        }
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });
        //then initialise
        this.initialise();
        //then report
        this.logWithContext(`Record/Replay Messenger created in with origin ${window.origin}`);

    }

    initialise = () => {

        if (this.contextIsIframe()) {

            //we are going to be looking from incoming messages from the content script using window.postMessage
            this.incomingMessageObservable = Rx.Observable.fromEventPattern(
                handler => {
                    window.addEventListener("message", handler, false);
                    this.logWithContext(`Record/Replay Messenger: SUBSCRIBED to Window Messaging Observer Instance`);
                },
                handler => {
                    window.removeEventListener(handler);
                    this.logWithContext(`Record/Replay Messenger: UNSUBSCRIBED from Window Messaging Observer Instance`);
                }
            )
            //we want to filter the messages so we only receive recording events
            .filter(item => item.constructor.name == this.constructorFilter);
            //TO DO
            //REPLAYS IN IFRAME WILL NEED TO RESPOND TO INCOMING WINDOW POST MESSAGE EVENTS 
            
        } else {

            //we are going to be looking for incoming messages from the content script using chrome.runtime
            this.incomingMessageObservable = Rx.Observable.fromEventPattern(
                handler => {
                    const wrapper = (request, sender, sendResponse) => {
                        const options = { async: false, request, sender, sendResponse }; 
                        handler(options);
                        return options.async;
                    };
                    this.logWithContext(`Record/Replay Messenger: SUBSCRIBED to Chrome Runtime Messaging Observer Instance`); 
                    chrome.runtime.onMessage.addListener(wrapper);
                    return wrapper;
                },
                (_, wrapper) => {
                    this.logWithContext(`Record/Replay Messenger: UNSUBSCRIBED from Chrome Runtime Messaging Observer Instance`); 
                    chrome.runtime.onMessage.removeListener(wrapper);
                }
            )
            //this is just to test the output
            .startWith({ async: {}, request: {recordingEvent: new RecordingEvent({})}, sender: {}, sendResponse: {} })
            //we want to filter the messages so we only receive recording events
            //.filter(item => item.request.recordingEvent.constructor.name == this.constructorFilter);

        }

    }

    sendMessage = message => {
        if (this.contextIsIframe()) {
            window.parent.postMessage(message, "*");
        } else {
            //this message is only sent from extension user interface to the background script to open recording tab so we need only one variety
            chrome.runtime.sendMessage(message, response => this.logWithContext(`Record/Replay Messenger: received: ${response.message}`));
        }
    }

}