class Recording {

    //pass in an options object with the values we are looking for
    constructor(options) {
        
        // set default values for the project class - these should be matched by the storage class
        const defaults = {
            //static recording defaults before recording first run - easy
            recordingName: 'N/A',
            recordingDescription: 'N/A',
            recordingAuthor: 'N/A',
            recordingCreated: Date.now(),
            recordingIsMobile: false,
            recordingMobileOrientation: 'portrait',
            recordingMobileDeviceId: 0,
            //displayed defaults from selected test
            recordingTestStartUrl: 'N/A',
            //inherited defaults from test selection lookup in local storage
            recordingProjectId: 0,
            recordingProjectName: 'N/A',
            recordingTestId: 0,
            recordingTestName: 'N/A',
            recordingTestBandwidthValue: 0,
            recordingTestBandwidthName: 'N/A',
            recordingTestLatencyValue: 0,
            recordingTestLatencyName: 'N/A',
            recordingTestPerformanceTimings: false,
            recordingTestResourceLoads: false,
            recordingTestScreenshot: false,
            recordingTestVisualRegression: false,
            //container for recording event output from user interaction or page navigation
            recordingEventArray: []
        };      
        
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });
    }

    deleteRecordingEventById(recordingEventId) {
        this.recordingEventArray = this.recordingEventArray
            //get rid of the element that has been deleted
            .filter(item => item.recordingEventId != recordingEventId)
            //then adjust the time since previous
            .map((recordingEvent, index, array) => {
                //the time since previous of the first item is always 0, so if the first item is deleted we end up with an absolute timestamp for the second item
                if (index == 0) { recordingEvent.recordingTimeSincePrevious = 0; return recordingEvent; }
                //otherwise we need to go through to the end of the array, comparing the current event with the one before it in the index
                else {
                    //so recording event time since previous is equal to the difference in their event created times
                    recordingEvent.recordingTimeSincePrevious = recordingEvent.recordingEventCreated - array[index-1].recordingEventCreated;
                    //then return the mutated element
                    return recordingEvent;
                }
            });
    }

    findRecordingEventById(recordingEventId) {
        //we know that the event is in the array so a simple find is fine
        return this.recordingEventArray.find(event => event.recordingEventId == recordingEventId);
    }

}