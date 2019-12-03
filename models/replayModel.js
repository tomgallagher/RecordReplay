class Replay extends Recording {

    //pass in a existing recording object with the values we are looking for
    constructor(recording, options) {

        // call the super class constructor and pass in the existing recording event
        super(recording);
        // set extra default values for the replay event class
        const defaults = {
            //we need to generate a replay name automatically as there can be many replays of the same recording
            replayName: 'N/A',
            //we need to port the starting url over from the recording
            replayName: 'N/A',
            //we need to know when the replay was created
            replayCreated: Date.now(),
            //we need to know when the replay was executed
            replayExecuted: 0,
            //we need to know when the replay failed, if it does
            replayFailTime: 0,
            //we need to have a replay status, null to start then boolean for success or failure
            replayStatus: null,
            //the replay needs to have an array for events that are replayed
            replayEventArray: [] 
        };
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });


    }

    deleteReplayEventById(replayEventId) {
        this.replayEventArray = this.replayEventArray
            //get rid of the element that has been deleted
            .filter(item => item.replayEventId != replayEventId)
            //then adjust the time since previous
            .map((replayEvent, index, array) => {
                //the time since previous of the first item is always 0, so if the first item is deleted we end up with an absolute timestamp for the second item
                if (index == 0) { replayEvent.recordingTimeSincePrevious = 0; return replayEvent; }
                //otherwise we need to go through to the end of the array, comparing the current event with the one before it in the index
                else {
                    //so recording event time since previous is equal to the difference in their event created times
                    replayEvent.recordingTimeSincePrevious = replayEvent.recordingEventCreated - array[index-1].recordingEventCreated;
                    //then return the mutated element
                    return replayEvent;
                }
            });
    }

}