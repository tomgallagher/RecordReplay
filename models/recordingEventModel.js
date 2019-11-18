class RecordingEvent {

    //pass in an options object with the values we are looking for
    constructor(options) {
  
        // set default values for the recording event class 
        const defaults = {
            recordingEventContext: '',
            recordingEventIsIframe: false,
            recordingEventCategory: '',
            recordingEventType: '',
            recordingEventValue: null,
            recordingEventElementType: null,
            recordingEventOuterHTML: '',
            recordingEventCssSelectorPath: '',
            recordingEventCssDomPath: '',
            recordingEventCssSimmerPath: '',
            recordingEventXPath: '',
            recordingEventCreated: Date.now(),
            recordingEventEdited: 0
        };      
        
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });
    }
  
}