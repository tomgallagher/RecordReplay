class Messenger {

    //pass in an options object
    constructor(options) {

        // set default values for the keycodes class 
        const defaults = {
            //you can access the type of object using object.constructor.name
            eventType: "RecordingEvent",
            //all messengers need the ability to detect if they are in an iframe
            contextIsIframe: () => { 
                try { return window.self !== window.top; } 
                catch (e) { return true; } 
            },
            //all messengers need the ability to detect if they are in a content script
            contextIsContentScript: () => { return typeof chrome.runtime.getManifest != 'undefined' }
        }
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });

        //then report
        this.contextIsIframe == true ? console.log(`%cMessenger created in iframe with origin ${window.origin}`, 'color: green') : null;
        this.contextIsContentScript == true ? console.log(`%cMessenger created in Content Script / User Interface with origin ${window.origin}`, 'color: blue'): null

    }

}