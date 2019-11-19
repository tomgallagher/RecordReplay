class RecordingEvent {

    //pass in an options object with the values we are looking for
    constructor(options) {
  
        // set default values for the recording event class 
        const defaults = {
            //general information applicable to all events
            recordingEventId: `recordingEvent#${(Math.floor(Math.random() * 90000) + 10000)}#${Date.now()}`,
            recordingEventOrigin: 'User',
            recordingEventAction: '',
            recordingEventHTMLElement: 'HTMLElement',
            recordingEventHTMLTag: '',
            recordingEventCssSelectorPath: '',
            recordingEventCssDomPath: '',
            recordingEventCssSimmerPath: '',
            recordingEventXPath: '',
            recordingEventLocation: '',
            recordingEventIsIframe: false,
            recordingEventCreated: Date.now(),
            recordingEventEdited: 0,
            //information specific to input events
            recordingEventInputType: 'N/A',
            recordingEventInputValue: 'N/A'
        };      
        
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });
    }
  
}