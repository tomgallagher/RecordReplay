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
            replayEventArray: [] 
        };
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });

    }

}