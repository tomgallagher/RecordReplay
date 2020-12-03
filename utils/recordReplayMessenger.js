class RecordReplayMessenger {
    //pass in an options object
    constructor(options) {
        // set default values for the keycodes class
        const defaults = {
            //we say whether we want the ability to return async responses
            asyncMessageListening: false,
            //we need to be able to show where the messenger has been instantiated
            contextIsIframe: () => {
                try {
                    return window.self !== window.top;
                } catch (e) {
                    return true;
                }
            },
            //then we need a function that logs accordint to context
            logWithContext: (message) =>
                this.contextIsIframe()
                    ? console.log(`%c${message} [iframe]`, 'color: green')
                    : console.log(`%c${message} [extension]`, 'color: blue'),
            //then we may need to listen to iframe messages from the windows postMessage function
            windowOnMessageObservable: Rx.Observable.fromEventPattern(
                (handler) => {
                    window.addEventListener('message', handler, false);
                    this.logWithContext(`Record/Replay Messenger: SUBSCRIBED to Window Messaging Observer Instance`);
                },
                (handler) => {
                    window.removeEventListener(handler);
                    this.logWithContext(
                        `Record/Replay Messenger: UNSUBSCRIBED from Window Messaging Observer Instance`
                    );
                }
            ),
            //extension functions will need the possibility of listening to extension messages
            chromeOnMessageObservable: Rx.Observable.fromEventPattern(
                (handler) => {
                    const wrapper = (request, sender, sendResponse) => {
                        const options = { async: this.asyncMessageListening, request, sender, sendResponse };
                        handler(options);
                        return options.async;
                    };
                    this.logWithContext(
                        `Record/Replay Messenger: SUBSCRIBED to Chrome Runtime Messaging Observer Instance`
                    );
                    chrome.runtime.onMessage.addListener(wrapper);
                    return wrapper;
                },
                (_, wrapper) => {
                    this.logWithContext(
                        `Record/Replay Messenger: UNSUBSCRIBED from Chrome Runtime Messaging Observer Instance`
                    );
                    chrome.runtime.onMessage.removeListener(wrapper);
                }
            ),
        };
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);

        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach((prop) => {
            this[prop] = opts[prop];
        });

        //then report
        this.logWithContext(`Record/Replay Messenger created in origin ${window.origin}`);
    }

    isAsync = (asyncMessageListening) => {
        //as we can't refer to one constructor key in another, we need to initialise as well
        this.asyncMessageListening = asyncMessageListening;
        return this;
    };

    //this message is only sent from extension user interface to the background script to open recording tab so we need only one variety
    sendMessage = (message) =>
        chrome.runtime.sendMessage(message, (response) =>
            this.logWithContext(`Record/Replay Messenger: Received Response Message: ${response.message}`)
        );

    sendMessageGetResponse = (message) => {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, (response) => {
                //the extension structure, with no message responses sent if correct replay environment is not found, means we have to check the error
                //As long as Chrome sees that you checked the value when there is an error (that is, evaluated it within your callback), the error will not be thrown.
                //WORTH NOTING THAT WITH MESSAGES BEING RELAYED BETWEEN INDEX.HTML AND CONTENT SCRIPTS, WE WILL USUALLY GET THE ERROR IN DUPLICATE
                if (chrome.runtime.lastError) {
                    console.info(chrome.runtime.lastError.message);
                    console.info(JSON.stringify(message));
                }
                response ? resolve(response) : null;
            });
        });
    };

    sendContentScriptMessageGetResponse = (tabId, message) => {
        return new Promise((resolve) => {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                //the extension structure, with no message responses sent if correct replay environment is not found, means we have to check the error
                //As long as Chrome sees that you checked the value when there is an error (that is, evaluated it within your callback), the error will not be thrown.
                //WORTH NOTING THAT WITH MESSAGES BEING RELAYED BETWEEN INDEX.HTML AND CONTENT SCRIPTS, WE WILL USUALLY GET THE ERROR IN DUPLICATE
                if (chrome.runtime.lastError) {
                    console.info(chrome.runtime.lastError.message);
                    console.info(JSON.stringify(message));
                }
                response ? resolve(response) : null;
            });
        });
    };
}
