class DomSelectorReport {

    constructor(options) {

        //the use of the anonymous async function in constructor enables us to set up the tab runner with any callback functions and receive responses
        //see https://stackoverflow.com/questions/43431550/async-await-class-constructor

        return (async () => {

            //we need to create a uniform class with the given selector, using inputs that we get from the EventRecorder
            this.selectorKey = options.key;
            this.selectorString = options.selectorString;
            this.targetHtmlElement = options.targetHtmlName;
            this.targetHtmlTag = options.targetHtmlTag;
            
            //then the class needs to provide log messages
            this.logMessages = [];
            //then the class needs to provide warning messages
            this.warningMessages = [];

            //and we're done - always remember to return this to the constructor in an async function or the whole thing is pointless
            return this; 

        })();


    }
}