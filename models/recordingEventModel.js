class RecordingEvent {

    //pass in an options object with the values we are looking for
    constructor(options) {
  
        // set default values for the recording event class 
        const defaults = {
            //general information applicable to all events
            recordingEventId: `recordingEvent#${(Math.floor(Math.random() * 90000) + 10000)}#${Date.now()}`,
            recordingEventOrigin: 'User',
            recordingEventAction: 'N/A',
            recordingEventActionType: 'N/A',
            recordingEventHTMLElement: 'HTMLElement',
            recordingEventHTMLTag: 'N/A',
            recordingEventCssSelectorPath: '',
            recordingEventCssDomPath: '',
            recordingEventCssFinderPath: '',
            recordingEventXPath: '',
            recordingEventLocation: 'N/A',
            recordingEventLocationHref: 'N/A',
            recordingEventIsIframe: false,
            recordingEventIframeName: 'N/A',
            recordingEventCreated: Date.now(),
            recordingEventTimestamp: performance.now(),
            recordingTimeSincePrevious: 0,
            recordingEventEdited: 0,
            //information specific to input events
            recordingEventInputType: 'N/A',
            recordingEventInputValue: 'N/A',
            //information specific to keyboard events, including the dispatch key event required for Chrome Devtools Protocol
            recordingEventKey: 'N/A',
            recordingEventCode: 'N/A',
            recordingEventKeyCode: 0,
            recordingEventDispatchKeyEvent: {},
            //information specific to text select events
            recordingEventTextSelectTextContent: 'N/A',
            recordingEventTextSelectTargetAsJSON: {},
            //information specific to hover events
            recordingEventHoverTargetAsJSON: {},
            //information specific to scroll events
            recordingEventXPosition: 0,
            recordingEventYPosition: 0,
            //information specific to file drop events events
            recordingEventFileBlob: null,
            recordingEventFileType: 'N/A'
        };      
        
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });
    }
  
}