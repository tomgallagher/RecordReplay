

/*

USER EVENTS

For User Events, we need to do several things, logging with error messages as well

1: ReplaySelectorReport: Check that the target element is on page, match HTMLElement and tag, fail if none, assess the performance of the selectors, save xpath of the element for matching with playback
2: TypeReplayer: Simulate the event on the element, we know the element is on the page. Artificial return value of true. Generate observable listener targeted at specific selector.
3: Messaging Observable: Listen to simulated event being played back, with matching xpath as css class selectors can change, fail if none, final confirmation that the replay has worked as intended

USER ASSERTIONS

1: ReplaySelectorReport: Check that the target element is on page, match HTMLElement and tag, fail if none, assess the performance of the selectors, save xpath of the element for matching with playback
2: TypeReplayer: Return value important: true for assertion passes. Simulate an artificial 'mouseenter' event on the element, generate an observable 'mouseenter' listener targeted at specific selector.
3: Messaging Observable: Check return value. Listen to simulated event being played back, with matching xpath as css class selectors can change, fail if none, final confirmation that the replay has worked as intended

*/

class MatchingUrlReport {

    constructor(replayEvent) {

        //we need to work out if the incoming message is intended for this content script - this can be complex with iframes which change their search params
        this.contentScriptUrl = new URL(window.location.href);
        this.eventTargetUrl = new URL(replayEvent.recordingEventLocationHref);
        //then we need to take some decisions based on the comparison between the two urls
        switch(true){
            //this differentiates host pages from third party iframes
            case this.contentScriptUrl.origin != this.eventTargetUrl.origin:
                EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Origin`);
                return false;
            //this differentiates host pages from same domain iframes
            case this.contentScriptUrl.pathname != this.eventTargetUrl.pathname:
                EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Path`);
                return false;
            //then we need to look in more detail at search params, which can vary on each loading of same domain or third party iframes
            case this.contentScriptUrl.search != this.eventTargetUrl.search:
                //we are going to need an object for each set of search params to make a more detailed judgment
                const contentScriptSearchParams = Object.fromEntries(this.contentScriptUrl.searchParams);
                const eventTargetSearchParams = Object.fromEntries(this.eventTargetUrl.searchParams);
                //so we can look for the equivalence is keys length by getting the keys array from each object
                const contentScriptKeys = Object.keys(contentScriptSearchParams);
                const eventTargetKeys = Object.keys(eventTargetSearchParams);
                //then work out if the length matches
                const lengthMatched = contentScriptKeys.length == eventTargetKeys.length;
                //then work out if the keys are the same, even if the values might have changed, using stringify to enable comparison of keys array
                const keysMatched = JSON.stringify(contentScriptKeys) == JSON.stringify(eventTargetKeys);
                //if they both match then it's a decent guess we are operating in the right ifrAme
                if (lengthMatched && keysMatched) {
                    //then we can return true
                    return true;
                } else {
                    //otherwise we need to report 
                    EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Search Params`);
                    return false;
                }
            //when we have no fails then we can just return true
                default:
                    EventReplayer.logWithContext(`Matched Location: Executing ${replayEvent.assertionId || replayEvent.replayEventId}`);
                    return true;

        }

    }

}

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

    //incoming replayEvent should have message.SendResponse({}) attached
    constructor(replayEvent) {

        //so there are generic properties that need to be imported into all specific replay classes from the replay event
        this.replayId = replayEvent.replayEventId;
        this.action = replayEvent.recordingEventAction;
        this.actionType = replayEvent.recordingEventActionType;
        this.targetHTMLName = replayEvent.recordingEventHTMLElement;
        this.targetTagName = replayEvent.recordingEventHTMLTag;
        this.cssSelectorPath = replayEvent.recordingEventCssSelectorPath;
        this.domPath = replayEvent.recordingEventCssDomPath;
        this.simmerPath = replayEvent.recordingEventCssSimmerPath;
        this.sendResponse = replayEvent.sendResponse || null;

        //then special property for text select checking
        this.selectedText = replayEvent.recordingEventTextSelectTextContent;

        //then there are generic state properties that we need for reporting back to the user interface
        this.replayLogMessages = [];
        this.replayErrorMessages = [];
        this.isIframe = EventReplayer.contextIsIframe();
        this.chosenSelectorReport = null;
        this.replayEventReplayed = 0;
        this.replayEventStatus = null;

        //first we check in each class that we have a matching url
        this.matchingUrlReport = new MatchingUrlReport(replayEvent);

        //if the matching url report returns false then we add the property that ensures it will be filtered
        if (this.matchingUrlReport == false) {
            //set the property
            this.replayEventStatus = false;
            //then just return this early as we have no need to so any further work
            //we also offer no report via return message from non-matching locations
            return this;
        }

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
            //then send the response if we have the facility
            if (this.sendResponse != null) {
                //first we make a clone of this 
                var replayExecution = Object.assign({}, this);
                //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
                delete replayExecution.sendResponse;
                //then we send the clean clone
                this.sendResponse({replayExecution: replayExecution});
            }            

        }

    }

    //all of the replayers must have an action function that will instantiate the replay - make it happen on the page
    actionFunction = () => {
        //here we need a very slight delay to ensure that our listener is in place before the action function executes
        return new Promise(resolve => {
            //we use setTimeout and resolve to introduce the delay
            setTimeout( () => {

                //we can handle all the normal click functions with the same bit of code, first creating the event
                const selectEvent = new Event("selectstart", {view: window, bubbles: true, cancelable: false}); 
                //then dispatching the event
                document.querySelector(this.chosenSelectorReport.selectorString).dispatchEvent( selectEvent );
                //then we depend on a mouseup event at the same location for our event recorder
                const mouseEvent = new MouseEvent("mouseup", {view: window, bubbles: true, cancelable: false}); 
                //then dispatching the event
                document.querySelector(this.chosenSelectorReport.selectorString).dispatchEvent( mouseEvent );
                //then report to the log messages array
                this.replayLogMessages.push(`${this.actionType.toUpperCase()} Event Dispatched`);
                //then return the window selection is the same as our saved selection
                resolve(window.getSelection().toString() == this.selectedText);

            }, 5);
        });

    }

    returnPlayBackObservable = () => Rx.Observable.fromEvent(document.querySelector(this.chosenSelectorReport.selectorString), "selectstart")

}

class MouseReplay {

    //incoming replayEvent should have message.SendResponse({}) attached
    constructor(replayEvent) {

        //so there are generic properties that need to be imported into all specific replay classes from the replay event
        this.replayId = replayEvent.replayEventId;
        this.action = replayEvent.recordingEventAction;
        this.actionType = replayEvent.recordingEventActionType;
        this.targetHTMLName = replayEvent.recordingEventHTMLElement;
        this.targetTagName = replayEvent.recordingEventHTMLTag;
        this.cssSelectorPath = replayEvent.recordingEventCssSelectorPath;
        this.domPath = replayEvent.recordingEventCssDomPath;
        this.simmerPath = replayEvent.recordingEventCssSimmerPath;
        this.sendResponse = replayEvent.sendResponse || null;

        //then there are generic state properties that we need for reporting back to the user interface
        this.replayLogMessages = [];
        this.replayErrorMessages = [];
        this.isIframe = EventReplayer.contextIsIframe();
        this.chosenSelectorReport = null;
        this.replayEventReplayed = 0;
        this.replayEventStatus = null;

        //first we check in each class that we have a matching url
        this.matchingUrlReport = new MatchingUrlReport(replayEvent);

        //if the matching url report returns false then we add the property that ensures it will be filtered
        if (this.matchingUrlReport == false) {
            //set the property
            this.replayEventStatus = false;
            //then just return this early as we have no need to so any further work
            return this;
        }

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
            //then send the response if we have the facility
            if (this.sendResponse != null) {
                //first we make a clone of this 
                var replayExecution = Object.assign({}, this);
                //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
                delete replayExecution.sendResponse;
                //then we send the clean clone
                this.sendResponse({replayExecution: replayExecution});
            }            

        }

    }
    
    //all of the replayers must have an action function that will instantiate the replay - make it happen on the page
    actionFunction = () => {

        //here we need a very slight delay to ensure that our listener is in place before the action function executes
        return new Promise(resolve => {
            //we use setTimeout and resolve to introduce the delay
            setTimeout( () => {
                //set up our event
                var event;
                //for the mouse we have a variety of types that we need to handle when dispatching events
                switch(this.actionType) {
                    case 'click':
                    case 'contextmenu':
                    case 'dblclick':
                        //we can handle all the normal click functions with the same bit of code, first creating the event
                        event = new MouseEvent(this.actionType, {view: window, bubbles: true, cancelable: false}); 
                        //then dispatching the event
                        document.querySelector(this.chosenSelectorReport.selectorString).dispatchEvent( event );
                        //then report to the log messages array
                        this.replayLogMessages.push(`${this.actionType.toUpperCase()} Event Dispatched`);
                        break;
                    case 'hover':
                         //we can handle all the normal click functions with the same bit of code, first creating the event
                         event = new MouseEvent('mouseenter', {view: window, bubbles: true, cancelable: false}); 
                         //then dispatching the event
                         document.querySelector(this.chosenSelectorReport.selectorString).dispatchEvent( event );
                         //then report to the log messages array
                         this.replayLogMessages.push(`${this.actionType.toUpperCase()} Event Dispatched`);
                        break;
                    case 'recaptcha':
                         //we can handle all the normal click functions with the same bit of code, first creating the event
                         event = new MouseEvent('click', {view: window, bubbles: true, cancelable: false}); 
                         //then dispatching the event
                         document.querySelector(this.chosenSelectorReport.selectorString).dispatchEvent( event );
                         //then report to the log messages array
                         this.replayLogMessages.push(`${this.actionType.toUpperCase()} Event Dispatched`);
                        break;
                }
                //then we just return true for mouse events - this boolean is only activated as a false marker by assertion events
                resolve(true);
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
                return Rx.Observable.fromEvent(document.querySelector(this.chosenSelectorReport.selectorString), 'mouseenter')
            case 'recaptcha':
                return Rx.Observable.fromEvent(document.querySelector(this.chosenSelectorReport.selectorString), 'click')
        }

    }

}

class InputReplay {

    //incoming replayEvent should have message.SendResponse({}) attached
    constructor(replayEvent) {



    }
    

}

class KeyboardReplay {

    //incoming replayEvent should have message.SendResponse({}) attached
    constructor(replayEvent) {



    }
    

}

class ScrollReplay {

    //incoming replayEvent should have message.SendResponse({}) attached
    constructor(replayEvent) {



    }
    

}

class AssertionReplay {

    //incoming replayEvent should have message.SendResponse({}) attached
    constructor(replayEvent) {
        //as an assertion event, this has special properties


    }
    
    /*
    Then we need to check either

    1) PRESENT: Has attribute
    2) CONTENT: Has Attribute, Get attribute
    3) TEXT CONTENT: Has text childnodes, get textContent

    */

}

var EventReplayer = {
    logWithContext: message => {
        if (EventReplayer.contextIsIframe()) {
            console.log(`%cEvent Replayer: ${window.location.origin}: ${message}`, 'color: green');
        } else {
            console.log(`%cEvent Replayer: ${window.location.origin}: ${message}`, 'color: blue');
        }
    },
    mapEventToReplayer: replayEvent => {
        switch(replayEvent.recordingEventAction) {
            case 'TextSelect': return new TextSelectReplay(replayEvent)
            case 'Mouse': return new MouseReplay(replayEvent)
            case 'Input': return new InputReplay(replayEvent)
            case 'Keyboard': return new KeyboardReplay(replayEvent)
            case 'Scroll': return new ScrollReplay(replayEvent)
            case 'Assertion': return new AssertionReplay(replayEvent)
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
        
        //WHEN WE ARE MESSAGING WE HAVE TO CREATE A REPLAY EVENT FROM THE INCOMING messageObject.request.replayEvent AND ADD the messageObject.sendResponse TO THE REPLAY EVENT

        //then we operate a filter so we only receive origin 'User' mouse or keyboard events and 'Replay' assertion events
        .filter(replayEvent => replayEvent.recordingEventOrigin == 'User' || replayEvent.recordingEventOrigin == 'Replay')
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
            (typeReplayer, [event, actionFunctionResult]) =>{
                //then at this point we need to do multiple checks, starting with the check that the function has executed within the time frame
                if (event == "Execution Playback Timeout") {
                    // we report the time of the fail
                    typeReplayer.replayEventReplayed = Date.now();
                    //and we set the status to false to indicate a failed replay
                    typeReplayer.replayEventStatus = false;
                    //and we need to provide information on why the replay failed
                    typeReplayer.replayErrorMessages.push(`${typeReplayer.actionType.toUpperCase()} ${event}`)
                    //then send the response if we have the facility
                    if (typeReplayer.sendResponse != null) {
                        //first we make a clone of this 
                        var replayExecution = Object.assign({}, typeReplayer);
                        //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
                        delete replayExecution.sendResponse;
                        //then we send the clean clone
                        typeReplayer.sendResponse({replayExecution: replayExecution});
                    }   
                    //and then we should return the typeReplayer - it will be filtered out
                    return typeReplayer;
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
                    typeReplayer.replayErrorMessages.push(`${typeReplayer.actionType.toUpperCase()} Execution Playback Misalignment`)
                    //then send the response if we have the facility
                    if (typeReplayer.sendResponse != null) {
                        //first we make a clone of this 
                        var replayExecution = Object.assign({}, typeReplayer);
                        //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
                        delete replayExecution.sendResponse;
                        //then we send the clean clone
                        typeReplayer.sendResponse({replayExecution: replayExecution});
                    }   
                    //and then we should return the typeReplayer - it will be filtered out
                    return typeReplayer;
                }
                //then we need to check if our assertion actionFunctionResult has failed
                if (actionFunctionResult == false) {
                    // we report the time of the fail
                    typeReplayer.replayEventReplayed = Date.now();
                    //and we set the status to false to indicate a failed replay
                    typeReplayer.replayEventStatus = false;
                    //and we need to provide information on why the replay failed
                    typeReplayer.replayErrorMessages.push(`${typeReplayer.actionType.toUpperCase()} Assertion Failed`)
                    //then send the response if we have the facility
                    if (typeReplayer.sendResponse != null) {
                        //first we make a clone of this 
                        var replayExecution = Object.assign({}, typeReplayer);
                        //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
                        delete replayExecution.sendResponse;
                        //then we send the clean clone
                        typeReplayer.sendResponse({replayExecution: replayExecution});
                    }   
                    //and then we should return the typeReplayer - it will be filtered out
                    return typeReplayer;
                } else {
                    //we need to confirm we have matching text content, attributes, etc
                    typeReplayer.replayLogMessages.push(`${typeReplayer.actionType.toUpperCase()} Assertion Passed`);
                }
                //otherwise we have a successful event replay and we need to update the event player to indicate that
                // we report the time of the fail
                typeReplayer.replayEventReplayed = Date.now();
                //and we set the status to false to indicate a failed replay
                typeReplayer.replayEventStatus = true;
                //then report to the log messages array
                typeReplayer.replayLogMessages.push(`${typeReplayer.actionType.toUpperCase()} Event Playback Confirmed`);
                //then return so we can send the message back to the user interface
                return typeReplayer;
            }
        )
        .filter(typeReplayer => typeReplayer.replayEventStatus)
        



        .subscribe(
            typeReplayer => {
                console.log(typeReplayer)
                //then send the response if we have the facility
                if (typeReplayer.sendResponse != null) {
                    //first we make a clone of this 
                    var replayExecution = Object.assign({}, typeReplayer);
                    //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
                    delete replayExecution.sendResponse;
                    //then we send the clean clone
                    typeReplayer.sendResponse({replayExecution: replayExecution});
                }   
            },
            error => console.error(error),
            () => console.log("EventReplayer.startReplayingEvents: COMPLETE")
        );


}