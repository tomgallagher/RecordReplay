class Recording {

    //pass in an options object with the values we are looking for
    constructor(options) {
        
        // set default values for the project class - these should be matched by the storage class
        const defaults = {
            //static recording defaults before recording first run - easy
            recordingName: 'N/A',
            recordingDescription: 'N/A',
            recordingAuthor: 'N/A',
            recordingIsMobile: false,
            recordingMobileOrientation: 'portrait',
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
            //container for recording event output from user interaction or page navigation
            recordingEventArray: []
        };      
        
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });
    }
    
    sortRecordingEventsByTimestamp() {
        this.recordingEventArray = this.recordingEventArray.sort(
            (previousRecordingEvent, currentRecordingEvent) => {
                //so we need a way of resolving ties - we use the performance timestamp here
                //note that performance timestamps start from page load
                if (previousRecordingEvent.recordingEventCreated = currentRecordingEvent.recordingEventCreated) {
                    return previousRecordingEvent.recordingEventTimestamp - currentRecordingEvent.recordingEventTimestamp;
                } else {
                    return previousRecordingEvent.recordingEventCreated - currentRecordingEvent.recordingEventCreated
                }
            }
        );
    }

    deleteRecordingEventById(recordingEventId) {
        this.recordingEventArray = this.recordingEventArray.filter(item => item.recordingEventId != recordingEventId);
        this.sortRecordingEventsByTimestamp();
    }

}