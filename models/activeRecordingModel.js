class ActiveRecording extends Recording {

    //pass in a existing recording object with the values we are looking for
    constructor(recording, options) {
        // call the super class constructor and pass in the existing recording
        super(recording)
        // set default values for the active recording class
        const defaults = {
            recordingScriptsArray: [
                "recordingScripts/cssSelectorGenerator.js", 
                "recordingScripts/dompath.js",
                "recordingScripts/simmer.js",
                "utils/recordReplayMessenger.js",
                "recordingScripts/eventsRecorder.js"
            ],
            recordingScriptsString: "N/A",
            recordingBrowserTabId: 0
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
            //then we add all the text together - use reduce rather than scan as we only need the finial emission from a finite observable
            .reduce((previousScriptText, currentScriptText) => previousScriptText + "\n\n" + currentScriptText)
            //then when we have finished, we will get an emission with reduce
            .subscribe(
                collectedText => this.recordingScriptsString = collectedText,
                error => console.error(error),
                () => console.log("Active Recording has Collected ALL scripts into recordingScriptsString")
            );

    }

}