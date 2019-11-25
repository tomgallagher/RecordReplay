class ActiveRecording extends Recording {

    //pass in a existing recording object with the values we are looking for
    constructor(recording, options) {
        // call the super class constructor and pass in the existing recording
        super(recording)
        // set default values for the active recording class
        const defaults = {
            recordingScriptsArray: [
                "third_party/Rx.min.js",
                "recordingScripts/cssSelectorGenerator.js", 
                "recordingScripts/dompath.js",
                "recordingScripts/simmer.js",
                "models/recordingEventModel.js",
                "utils/recordReplayMessenger.js",
                "utils/keyCodeDictionary.js",
                "recordingScripts/eventsRecorder.js"
            ],
            recordingScriptsString: "N/A",
            recordingBrowserTabRunner: null
        };
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });

    }

    generateScriptString = () => {

        //we start off with the local urls for the extension
        Rx.Observable.from(this.recordingScriptsArray)
            //we then map those urls to urls we can fetch with an ajax call
            .map(url => chrome.runtime.getURL(url))
            //then we do each of the calls to get the script text
            .concatMap(chromeUrl => Rx.Observable.ajax({url: chromeUrl, responseType: "text"}) )
            //then we map the responses into the strings
            .map(data => data.response.toString())
            //then we add all the text together - use reduce rather than scan as we only need the final emission from a finite observable
            .reduce((previousScriptText, currentScriptText) => previousScriptText + "\n\n" + currentScriptText)
            //then when we have finished, we will get an emission with reduce
            .subscribe(
                //save the collected script string to the model property so we can inject all scripts as a single string into Remote Devtools Protocol controlled tab instance
                collectedText => this.recordingScriptsString = collectedText,
                //log any errors obviously
                error => console.error(error),
                //then we log the completion of this event to ensure that the async task is not completing after its output might be required
                () => console.log(`%cActive Recording has Collected ALL scripts into recordingScriptsString [extension]`, 'color: blue')
            );

    }

}