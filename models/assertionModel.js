class Assertion extends RecordingEvent {

    //pass in a existing recording object with the values we are looking for
    constructor(recordingEvent, options) {

        // call the super class constructor and pass in the existing recording event
        super(recordingEvent);
        // set default values assertion class
        const defaults = {
            //so we need some categories to show when we include assertions in tables alongside other replay events
            assertionEventOrigin: 'Replay',
            assertionEventAction: 'Assertion',
            //we are going to need to have a unique id for each assertion
            assertionId: `replayAssertion#${(Math.floor(Math.random() * 90000) + 10000)}#${Date.now()}`,
            //then we are going to want to know when the assertion was tested
            assertionEventReplayed: 0,
            //then we are going to want the assertion time since previous
            assertionTimeSincePrevious: 0,
            //then we need to know if each assertion has passed or failed, started with null then boolean
            assertionEventStatus: null,
            //then we are going to want to have log messages so we can report to the user
            assertionLogMessages: [],
            //then we are going to want to know why the assertion event has failed
            assertionErrorMessages: [],
            //then we are going to want to know which selector was used in the assertion
            assertionChosenSelectorString: "",
            //we need to have the kind of assertion, is it Text Content, Present or Content
            assertionType: "Present",
            //we need to have the attribute we are looking to assert on
            assertionAttribute: "N/A",
            //we need to have the attribute value we may be looking to assert on
            assertionValue: "N/A",
            //then we may need to know the type of element we are looking to assert on, in case of nested assertions, this allows further searching in target element
            assertionElement: "ROOT",
            //then we may need to know the nested level, in case we want to display an existing assertion in the user interface and check the checkbox
            assertionNestedLevel: 0,
            //then we need to have a property for internal testing of assertions
            //this should only be true for any assertions saved in test.json file
            assertionShouldFail: false
        };
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });

    }

}