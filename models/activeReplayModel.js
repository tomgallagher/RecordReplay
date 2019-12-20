class ActiveReplay extends Replay {

    //pass in a existing replay object with the values we are looking for
    constructor(replay, options) {
        // call the super class constructor and pass in the existing replay twice, once for instantiate of the recording and once for the replay
        super(replay, replay)
        // set extra default values for the active replay class
        const defaults = {
            //just so we can keep track of the replay id as indicated in the database
            replayID: 0,
            //then we need to carry the original start message sendResponse function along with us
            replayStartResponse: null,
            //we need these scripts to be injected into every main_frame and sub_frame in the curated page
            replayScriptsArray: [
                "third_party/Rx.min.js",
                "utils/recordReplayMessenger.js",
                "replayingScripts/matchingURLReport.js",
                "replayingScripts/replaySelectorReport.js",
                "replayingScripts/replayXpathReport.js",
                "replayingScripts/mouseReplay.js",
                "replayingScripts/textSelectReplay.js",
                "replayingScripts/inputReplay.js",
                "replayingScripts/scrollReplay.js",
                "replayingScripts/elementScrollReplay.js",
                "replayingScripts/assertionReplay.js",
                "replayingScripts/eventsReplayer.js"
            ],
            //we controls the creation of the scripts string, it's easier than looping through the scripts and loading each from file
            replayScriptsString: "N/A",
            //every active replay should have its own tab runner that it can control, so when the replay becomes inactive it stops
            replayBrowserTabRunner: null,
            //every active replay should have its own messenger so it can send async messages
            replayBrowserMessenger: new RecordReplayMessenger({}).isAsync(true)
        };
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });

    }

    initialise = () => {

        return new Promise(resolve => {

            //we start off with the local urls for the extension
            Rx.Observable.from(this.replayScriptsArray)
                //we then map those urls to urls we can fetch with an ajax call
                .map(url => chrome.runtime.getURL(url))
                //then we do each of the calls to get the script text
                .concatMap(chromeUrl => Rx.Observable.ajax({url: chromeUrl, responseType: "text"}) )
                //then we map the responses into the strings
                .map(data => data.response.toString())
                //then we add all the text together - use reduce rather than scan as we only need the final emission from a finite observable
                .reduce((previousScriptText, currentScriptText) => previousScriptText + "\r\n\n" + currentScriptText)
                //then when we have finished, we will get an emission with reduce
                .subscribe(
                    //save the collected script string to the model property so we can inject all scripts as a single string into Remote Devtools Protocol controlled tab instance
                    collectedText => this.replayScriptsString = collectedText,
                    //log any errors obviously
                    error => console.error(error),
                    //then we log the completion of this event to ensure that the async task is not completing after its output might be required
                    () => {
                        console.log(`%cActive Replay has Collected ALL scripts into replayScriptsString [extension]`, 'color: blue');
                        resolve(this);
                    }
                );

        });

    }

}




