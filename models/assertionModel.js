class Assertion {

    constructor(options) {

        // set default values assertion class
        const defaults = {
            //we are going to need to have a unique id for each assertion
            assertionId: `replayAssertion#${(Math.floor(Math.random() * 90000) + 10000)}#${Date.now()}`,
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
            //then we need to know if each assertion has passed or failed, started with null then boolean
            assertionStatus: null,
            //then we should keep track of the parent replay event
            assertionReplayEventId: "N/A"
        };
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });

    }

}