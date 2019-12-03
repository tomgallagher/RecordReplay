class ReplayEvent extends RecordingEvent {

    //pass in a existing recording object with the values we are looking for
    constructor(recordingEvent, options) {

        // call the super class constructor and pass in the existing recording event
        super(recordingEvent);
        // set extra default values for the replay event class
        const defaults = {
            //general information applicable to all events
            replayEventId: `replayEvent#${(Math.floor(Math.random() * 90000) + 10000)}#${Date.now()}`,
            //then we are going to want to know when the event was replayed
            replayEventReplayed: 0,
            //then we are going to want to know if the replay event has passed or failed, started with null then boolean
            replayEventStatus: null,
            //then we are going to want to know why the replay event has passed or failed, beyond assertion failures
            replayEventMessages: [],
            //then we want to have an array that can hold all of the assertions that are required for this replay event
            replayEventAssertionArray: []
        };
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });

    }

    //then we need a way of deleting assertions from the replay event
    deleteAssertionById(assertionId) {
        this.replayEventAssertionArray = this.replayEventAssertionArray
            //get rid of the element that has been deleted
            .filter(item => item.assertionId != assertionId);
    }

}