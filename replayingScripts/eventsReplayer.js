

/*

//so we have an incoming set of events that need to be actioned and verified

//USER EVENTS

For User Events, we need to do several things

1: First check that the target element is on the page, some kind of fail if none, then assess the performance of the selectors if one or more
2: Simulate the event on the element, we know the element is on the page, what return value can we get from here?
3: Listen to the simulated event being reflected back, this is final confirmation that the replay has worked as intended

1 Checking the target element is on the page

For all three CSS selectors we can use:

we can use document.querySelector, which returns the first element to match the selector or null
we can use document.querySelectorAll, which returns an array-like structure with 0 to many elements in it

We can then evaluate the performance of the selectors, we should get an element and an array with one element if the selector is doing its job properly
If we get more than one element in array then this should be a WARNING

we can use xpath document.evaluate(
  xpathExpression, a string representing the XPath to be evaluated
  contextNode, It's common to pass document as the context node
  namespaceResolver, null is common for HTML documents or when no namespace prefixes are used.
  resultType, Use named constant properties, such as XPathResult.ANY_TYPE
  result result is an existing XPathResult to use for the results. null is the most common and will create a new XPathResult
);

to FIND elements = although it's hard to see how this will succeed when others fail. We could have changing classes, which would cause a fail
If so, then we need to emit a WARNING, if the matching HTMLElement and tag succeed

We can then check that the target element is matching in terms of HTMLElement and tag, information that we have from the event, make sure we choose the right method regarding uppercase etc

We then save the xpath of the element for matching with playback

2 Simulate the event on the element

Use the standard dispatchEvent method for most of the replays

3 Listen to Playback

Here we cannot rely on the CSS selector being the same as the target can mutate after clicks. 
We can do what the event handler does and get the pre-click selector
Or we can check the xpath of the selected element and then the xpath of the event element and compare the two - this is better as it confirms the equality of position in the document
Port the xpath function from eventRecorder


//USER ASSERTIONS

Just need to do a search as in Step 1 of User Events

Then we need to check either

1) PRESENT: Has attribute
2) CONTENT: Has Attribute, Get attribute
3) TEXT CONTENT: Has text childnodes, get textContent

*/

class ReplaySelectorReport {

    constructor(options) {

        //we need to create a uniform class with the given selector, using inputs that we get from the EventRecorder
        this.selectorKey = options.key;
        this.selectorString = options.selectorString;
        this.targetHtmlElement = options.targetHtmlName;
        this.targetHtmlTag = options.targetHtmlTag;
        
        //then the class needs to provide log messages
        this.logMessages = [];
        //then the class needs to provide warning messages
        this.warningMessages = []; 

        //then we need to start performing our checks and adjusting the object as we go
        //see if we can find the selectedItem with document query
        this.selectedItem = document.querySelector(this.selectorString);
        //if the item is null, it cannot be found in the document
        if (this.selectedItem == null) {
            //so we need to report an invalid selector and return the object
            this.invalidSelector = true;
            //then give some feedback
            this.warningMessages.push(`${this.selectorKey} Selector Returned Null`);
            //this is an early exit as there's nothing more to do
            return this;
        }
        //if the item is not the same html element we need to return
        if (this.selectedItem.constructor.name != this.targetHtmlElement) {
            //so the CSS selector has found an element but it does not match by constrcutor name
            this.invalidSelector = true;
            //then give some feedback
            this.warningMessages.push(`${this.selectorKey} Unmatched Constructor Name`);
            //this is an early exit as there's nothing more to do
            return this;
        }
        //if the item does not have the same tagname we need to return
        if (this.selectedItem.tagName != this.targetHtmlTag) {
            //so the CSS selector has found an element but it does not match by tag name
            this.invalidSelector = true;
            //then give some feedback
            this.warningMessages.push(`${this.selectorKey} Unmatched Tag Name`);
            //this is an early exit as there's nothing more to do
            return this;
        }

        //then we need to warn on multiple matches, as we can start to have problems with targeting
        this.selectedItems = [].slice.call(document.querySelectorAll(this.selectorString));
        //we cannot afford to use a selector that generates multiple matches
        if (this.selectedItems.length > 1) {
            //so the CSS selector has found too many elements
            this.invalidSelector = true;
            //then give some feedback
            this.warningMessages.push(`${this.selectorKey} Multiple Selector Matches`);
            //this is an early exit as there's nothing more to do
            return this;
        }

        //then if we pass all the checks, we want to get the xpath of the selected element, so we can check against the listener later
        this.xpath = this.getXpath();
        //then we report good finish
        this.logMessages.push(`${this.selectorKey} Found in Document`);

    }

    //function for defining xpath of element, arrow syntax means no need to bind(this)
    getXpath = () => {
        //get all the nodes in the document by tagname wildcard
        var allNodes = document.getElementsByTagName('*');
        //create the array to hold the different bits of the xpath, execute the code block if we have an element and the element is an element node, 
        //then jump up to parent when finished with each node   
        for (var segs = []; this.selectedItem && this.selectedItem.nodeType == 1; this.selectedItem = this.selectedItem.parentNode) {
            //check to see if the element has an id because this is then going to be fast
            if (this.selectedItem.hasAttribute('id')) {
                //set the marker for whether the id is unique in the page
                var uniqueIdCount = 0;
                //search through all the nodes 
                for (var n=0; n < allNodes.length; n++) {
                    //if we have a duplicate id, this is not going to work so bump the marker
                    if (allNodes[n].hasAttribute('id') && allNodes[n].id == this.selectedItem.id) uniqueIdCount++;
                    //then if we do not have a unique id we break out of the loop
                    if (uniqueIdCount > 1) break;
                }
                //the marker holds the value
                if (uniqueIdCount == 1) {
                    //if we only have one element with that id we can create the xpath now so we push the start path and then id into the array at the beginning
                    segs.unshift("//*[@id='" + this.selectedItem.getAttribute('id') + "']");
                    //then we're done and we send it back to the caller
                    return segs.join('/');
                } else {
                    //otherwise we save the tagname and the id and continue on as we are going to need more qualifiers for a unqiue xpath
                    segs.unshift(element.localName.toLowerCase() + '[@id="' + this.selectedItem.getAttribute('id') + '"]');
                }
            } else {
                //with no id, we need to do something different
                //we need to identify its place amongst siblings - is it the first list item or the third
                for (var i = 1, sib = this.selectedItem.previousSibling; sib; sib = sib.previousSibling) {
                    //this counts back until we have no previous sibling
                    if (sib.localName == this.selectedItem.localName)  i++; 
                }
                //just push the local name into the array along with the position
                segs.unshift(this.selectedItem.localName.toLowerCase() + '[' + i + ']');
            }
         }
         //then once we've worked our way up to an element with id or we are at the element with no parentNode - the html - we return all the strings joined with a backslash
         return segs.length ? '/' + segs.join('/') : null;
    }

}

class TextSelectReplay {

    constructor(replayEvent) {

        


    }

}
class MouseReplay {

    constructor(replayEvent) {

        //so there are generic properties that need to be imported into all specific replay classes
        this.replayId = replayEvent.replayEventId;
        this.action = replayEvent.recordingEventAction;
        this.actionType = replayEvent.recordingEventActionType;
        this.targetHTMLName = replayEvent.recordingEventHTMLElement;
        this.targetTagName = replayEvent.recordingEventHTMLTag;
        this.cssSelectorPath = replayEvent.recordingEventCssSelectorPath;
        this.domPath = replayEvent.recordingEventCssDomPath;
        this.simmerPath = replayEvent.recordingEventCssSimmerPath;
        this.chosenSelectorReport = null;

        //then there are generic state properties that we need for reporting back to the user interface
        this.replayLogMessages = [];
        this.replayErrorMessages = [];
        this.replayEventReplayed = 0;
        this.replayEventStatus = null;

        //then each replay class must have a collected set of Replay Selector Reports
        this.replaySelectorReports = [
            new ReplaySelectorReport({ key: "CssSelector", selectorString: this.cssSelectorPath, targetHtmlName: this.targetHTMLName, targetHtmlTag: this.targetTagName }),
            new ReplaySelectorReport({ key: "DomPathSelector", selectorString: this.domPath, targetHtmlName: this.targetHTMLName, targetHtmlTag: this.targetTagName }),
            new ReplaySelectorReport({ key: "SimmerSelector", selectorString: this.simmerPath, targetHtmlName: this.targetHTMLName, targetHtmlTag: this.targetTagName })
        ];
        
        //see if we have any invalid selector reports
        this.failedReplaySelectorReports = this.replaySelectorReports.filter(report => report.invalidSelector);
        //if we have invalid selectors then we need to know
        if (this.failedReplaySelectorReports.length > 0) this.replayErrorMessages.push(this.failedReplaySelectorReports.map(report => report.warningMessages).join(', '));
        //see if we have any valid selector reports, and if we do, we save as the definitive selector reports 
        this.replaySelectorReports = this.replaySelectorReports.filter(report => !report.invalidSelector);
        //if we have valid selectors then we need to know about which ones remain valid
        if (this.replaySelectorReports.length > 0) this.replayLogMessages.push(this.replaySelectorReports.map(report => report.logMessages).join(', '));

        //then we need to have an outcome
        if (this.replaySelectorReports.length > 0) {
            //select the first report that has provided a positive response
            this.chosenSelectorReport = this.replaySelectorReports[0];
        } else {
            //otherwise we report the time of the fail
            this.replayEventReplayed = Date.now();
            //and we set the status to false to indicate a failed replay
            this.replayEventStatus = false;
            //TO DO
            //we should send a message back to the user interface at this point

        }

    }
    
    //all of the replayers must have an action function that will instantiate the replay - make it happen on the page
    actionFunction = () => {

        //here we need a very slight delay to ensure that our listener is in place before the action function executes
        return new Promise(resolve => {
            //we use setTimeout and resolve to introduce the delay
            setTimeout( () => {
                //for the mouse we have a variety of types that we need to handle when dispatching events
                switch(this.actionType) {
                    case 'click':
                    case 'contextmenu':
                    case 'dblclick':
                        //we can handle all the normal click functions with the same bit of code, first creating the event
                        const event = new MouseEvent(this.actionType, {view: window, bubbles: true, cancelable: false}); 
                        //then dispatching the event
                        document.querySelector(this.chosenSelectorReport.selectorString).dispatchEvent( event );
                        //then report to the log messages array
                        this.replayLogMessages.push(`${this.actionType.toUpperCase()} Event Dispatched`);
                        break;
                    case 'hover':
                        //TO DO
                        break;
                    case 'recaptcha':
                        //TO DO
                        break;
                }
                //then we just return the action type for checking on execution of the function
                resolve(this.actionType);
            //we have the delay at 5 milliseconds but it could be longer
            }, 5);
        });

    }

    returnPlayBackObservable = () => {

        switch(this.actionType) {
            case 'click':
            case 'contextmenu':
            case 'dblclick':
                //we can handle all the normal click functions with the same bit of code, 
                return Rx.Observable.fromEvent(document.querySelector(this.chosenSelectorReport.selectorString), this.actionType)
            case 'hover':
                //TO DO
                break;
            case 'recaptcha':
                //TO DO
                break;
        }

    }

}

class InputReplay {

    constructor(replayEvent) {



    }
    //this is going to have to be sensitive to different types of click, also hover and recaptcha

}

class KeyboardReplay {

    constructor(replayEvent) {



    }
    //this is going to have to be sensitive to different types of click, also hover and recaptcha

}

var EventReplayer = {
    mapEventToReplayer: replayEvent => {
        switch(replayEvent.recordingEventAction) {
            case 'TextSelect': return new TextSelectReplay(replayEvent)
            case 'Mouse': return new MouseReplay(replayEvent)
            case 'Input': return new InputReplay(replayEvent)
            case 'Keyboard': return new KeyboardReplay(replayEvent)
            case 'Scroll': return new ScrollReplay(replayEvent)
        }
    },
    //we need to know if we are in an iframe - has implications right through the application
    contextIsIframe: () => { 
        try { return window.self !== window.top; } 
        catch (e) { return true; } 
    },
    //we should always be in the context of a content script
    contextIsContentScript: () => { return typeof chrome.runtime.getManifest != 'undefined' },
    //we need to have the xpath function to check the equivalence of the event listener target and the original event execution target
    getXPath: element => {
        //get all the nodes in the document by tagname wildcard
        var allNodes = document.getElementsByTagName('*');
        //create the array to hold the different bits of the xpath, execute the code block if we have an element and the element is an element node, 
        //then jump up to parent when finished with each node   
        for (var segs = []; element && element.nodeType == 1; element = element.parentNode) {
            //check to see if the element has an id because this is then going to be fast
            if (element.hasAttribute('id')) {
                //set the marker for whether the id is unique in the page
                var uniqueIdCount = 0;
                //search through all the nodes 
                for (var n=0; n < allNodes.length; n++) {
                    //if we have a duplicate id, this is not going to work so bump the marker
                    if (allNodes[n].hasAttribute('id') && allNodes[n].id == element.id) uniqueIdCount++;
                    //then if we do not have a unique id we break out of the loop
                    if (uniqueIdCount > 1) break;
                }
                //the marker holds the value
                if (uniqueIdCount == 1) {
                    //if we only have one element with that id we can create the xpath now so we push the start path and then id into the array at the beginning
                    segs.unshift("//*[@id='" + element.getAttribute('id') + "']");
                    //then we're done and we send it back to the caller
                    return segs.join('/');
                } else {
                    //otherwise we save the tagname and the id and continue on as we are going to need more qualifiers for a unqiue xpath
                    segs.unshift(element.localName.toLowerCase() + '[@id="' + element.getAttribute('id') + '"]');
                }
            } else {
                //with no id, we need to do something different
                //we need to identify its place amongst siblings - is it the first list item or the third
                for (var i = 1, sib = element.previousSibling; sib; sib = sib.previousSibling) {
                    //this counts back until we have no previous sibling
                    if (sib.localName == element.localName)  i++; 
                }
                //just push the local name into the array along with the position
                segs.unshift(element.localName.toLowerCase() + '[' + i + ']');
            }
         }
         //then once we've worked our way up to an element with id or we are at the element with no parentNode - the html - we return all the strings joined with a backslash
         return segs.length ? '/' + segs.join('/') : null;
     }
}

EventReplayer.startReplayingEvents = () => {

    //so here we would work with incoming messages, using the Record/Replay messenger
    //but for testing we work with array
    Rx.Observable.from(EventRecorder.testingEventsArray)

        //first we create a replay event from each recording event - ONLY FOR TESTING
        .map(event => new ReplayEvent(event, {}) )
        //then we have to manufacture the delay from the array - ONLY FOR TESTING
        //and we need to start with a dummy marker so we can operate with only one emission, this must come before pairwise() to create the first pair
        .startWith(new RecordingEvent({recordingEventOrigin: 'PairwiseStart'}))
        //then we need to get the time between each emission so we take two emissions at a time  - ONLY FOR TESTING
        .pairwise()
        //this then delivers an array with the previous and the current, we only need the current, with adjusted recordingTimeSincePrevious  - ONLY FOR TESTING
        .map(([previousRecording, currentRecording]) => {
            //if the previous was not the dummy 'PairwiseStart', then we need to add the relative time of the recording event so we can exactly reproduce timing steps with delays
            //if it is then the time will be 0, with zero delay, which is what we want
            //this can be actioned in the replay mode via .concatMap(event => Rx.Observable.of(event).delay(event.recordingTimeSincePrevious))
            previousRecording.recordingEventOrigin != 'PairwiseStart' ? currentRecording.recordingTimeSincePrevious = currentRecording.recordingEventCreated - previousRecording.recordingEventCreated : null;
            //then we just need to return the current recording as we don't care about the dummy or the previous
            return currentRecording;
        })
        //this adds the delay - ONLY FOR TESTING - we must do this in the user interface as it sends messages to many different windows
        .concatMap(replayEvent => Rx.Observable.of(replayEvent).delay(replayEvent.recordingTimeSincePrevious))
        
        //then we start operating our replay logic - we start by mapping the event to our individual event type handlers
        .map(replayEvent => EventReplayer.mapEventToReplayer(replayEvent) )
        //then we can filter all those event handlers that return with a state of false
        .filter(typeReplayer => typeReplayer.replayEventStatus != false)
        //then we have to add the listener for playback confirmation and subsequently execute the function
        .flatMap(typeReplayer =>
            //we have to have a check for failure at this stage as well, we do this with a merge and a timer
            Rx.Observable.merge(
                //we always need to have matching events - the event execution and the playback
                Rx.Observable.zip( typeReplayer.returnPlayBackObservable(), Rx.Observable.from(typeReplayer.actionFunction()) ),
                //then we need to assume that the playback listener and the action function happen in very quick time, otherwise the timer will emit first
                Rx.Observable.timer(50).map(timer => ["Execution Playback Timeout", timer])
            //then we take either the first emission from the action / playback observable or the timer 
            ).take(1), 
            //we need the original event replayer and the array that is returned by the zip function
            (typeReplayer, [event, actionType]) =>{
                //then at this point we need to do multiple checks, starting with the check that the function has executed within the time frame
                if (event == "Execution Playback Timeout") {
                    // we report the time of the fail
                    typeReplayer.replayEventReplayed = Date.now();
                    //and we set the status to false to indicate a failed replay
                    typeReplayer.replayEventStatus = false;
                    //and we need to provide information on why the replay failed
                    typeReplayer.replayErrorMessages.push(`${actionType.toUpperCase()} ${event}`)
                    //TO DO
                    //we should send a message back to the user interface at this point

                }
                //otherwise we need to get the xpath of the event target
                const eventTargetXpath = EventReplayer.getXPath(event.target);
                //then we need to check the equivalence of the xpath
                if (typeReplayer.chosenSelectorReport.xpath !== eventTargetXpath) {
                    // we report the time of the fail
                    typeReplayer.replayEventReplayed = Date.now();
                    //and we set the status to false to indicate a failed replay
                    typeReplayer.replayEventStatus = false;
                    //and we need to provide information on why the replay failed
                    typeReplayer.replayErrorMessages.push(`${actionType.toUpperCase()} ${event} Execution Playback Misalignment`)
                    //TO DO
                    //we should send a message back to the user interface at this point

                }
                //otherwise we have a successful event replay and we need to update the event player to indicate that
                // we report the time of the fail
                typeReplayer.replayEventReplayed = Date.now();
                //and we set the status to false to indicate a failed replay
                typeReplayer.replayEventStatus = true;
                //then report to the log messages array
                typeReplayer.replayLogMessages.push(`${actionType.toUpperCase()} Event Playback Confirmed`);
                //then return so we can send the message back to the user interface
                return typeReplayer;
            }
        )
        .filter(typeReplayer => typeReplayer.replayEventStatus != false)
        



        .subscribe(
            x => {
                console.log(x)
            },
            error => console.error(error),
            () => console.log("EventReplayer.startReplayingEvents: COMPLETE")
        );


}