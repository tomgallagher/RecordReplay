class Replay extends Recording {

    //pass in a existing recording object with the values we are looking for
    constructor(recording, options) {

        // call the super class constructor and pass in the existing recording event
        super(recording);
        // set extra default values for the replay event class
        const defaults = {
            //we need to generate a replay name automatically as there can be many replays of the same recording
            replayName: 'N/A',
            //then we need to port the start url
            replayRecordingStartUrl: 'N/A',
            //then we need to know the linked recording id
            replayRecordingId: options.replayRecordingId || 0,
            //we need to know when the replay was created
            replayCreated: Date.now(),
            //we need to know when the replay was executed
            replayExecuted: 0,
            //we need to know when the replay failed, if it does
            replayFailTime: 0,
            //we need to have a replay status, null to start then boolean for success or failure
            replayStatus: null,
            //the replay needs to have an array for events that are replayed
            replayEventArray: [],
            //the replay may save performance timings
            replayPerformanceTimings: {},
            //the replay may save resource loads,
            replayResourceLoads: {},
            //the replay may save screenshot as data property of object
            replayScreenShot: {}
        };
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });

    }

    //formatting functions for dates
    printExecutionTime = () => {
        if (this.replayExecuted == 0) return "Never"
        else return new Date(this.replayExecuted).toLocaleString();
    }

    printStatus = ()  => {
        switch(this.replayStatus) {
            case null: return "None"
            case true: return "Success"
            case false: return "Failed"
        }
    }

    sortReplayEventsByTime = () => {

        this.replayEventArray = this.replayEventArray
            //first we need to sort the array by timestamp
            .sort((previous, current) => { 
                //we need to deal with the situation where assertions have exactly the same timestamp as their matching mouse hover or text select events
                if (previous.recordingEventCreated == current.recordingEventCreated) {
                    //so if the current item has own property indicating it is an assertion then we just put it second in the queue
                    return current.hasOwnProperty('assertionId') ? -1 : 1;
                } else {
                    //otherwise we are happy to sort as normal
                    return previous.recordingEventCreated - current.recordingEventCreated; 
                }
            })
            //then adjust the time since previous
            .map((replayEvent, index, array) => {
                //the time since previous of the first item is always 0, so if the first item is deleted we end up with an absolute timestamp for the second item
                if (index == 0) { replayEvent.recordingTimeSincePrevious = 0; return replayEvent; }
                //otherwise we need to go through to the end of the array, comparing the current event with the one before it in the index
                else {
                    //again here we need a special exception for assertions with identical timestamps
                    if (replayEvent.recordingEventCreated == array[index-1].recordingEventCreated && replayEvent.hasOwnProperty('assertionId')) {
                        //where we have an exact match in timestamps we need to give a small difference so we can display a time difference that is not 0
                        //we use 0 to indicate the first entry so we need to set it at 1, an arbitrary small figure
                        //if we use a larger number, this could start to cause problems with many assertions
                        replayEvent.recordingTimeSincePrevious = 1;
                    } else {
                        //so recording event time since previous is equal to the difference in their event created times
                        replayEvent.recordingTimeSincePrevious = replayEvent.recordingEventCreated - array[index-1].recordingEventCreated;
                    }
                    //then return the mutated element
                    return replayEvent;
                }
            });
    
    }
    

}