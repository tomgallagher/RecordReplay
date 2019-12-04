class ReplayEvent extends RecordingEvent {

    //pass in a existing recording object with the values we are looking for
    constructor(recordingEvent, options) {

        // call the super class constructor and pass in the existing recording event
        super(recordingEvent);
        // set extra default values for the replay event class
        const defaults = {
            //we are going to need to have a unique id for each replay
            replayEventId: `replayEvent#${(Math.floor(Math.random() * 90000) + 10000)}#${Date.now()}`,
            //then we are going to want to know when the event was replayed
            replayEventReplayed: 0,
            //then we are going to want the replay times since previous
            replayTimeSincePrevious: 0,
            //then we are going to want to know if the replay event has passed or failed, started with null then boolean
            replayEventStatus: null,
            //then we are going to want to know why the replay event has passed or failed, beyond assertion failures
            replayEventMessages: []
        };
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });

    }

    //then we need a way of sorting that allows for 
    deleteAssertionById(assertionId) {
        this.replayEventAssertionArray = this.replayEventAssertionArray
            //get rid of the element that has been deleted
            .filter(item => item.assertionId != assertionId);
    }

}