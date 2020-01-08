//A LIST OF ALL WINDOW EVENTS FOR TOTAL USER INTERACTION COVERAGE
var EventRecorderEvents = {
    //The onsearch event occurs when a user presses the "ENTER" key or clicks the "x" button in an <input> element with type="search"
    //The oninput event occurs when an element gets user input - similar to the onchange event. The difference is that the oninput event 
    //occurs immediately after the value of an element has changed, while onchange occurs when the element loses focus, after the content has been changed. 
    //The oninvalid event occurs when a submittable <input> element is invalid.
    inputEvents: ["search", "change", "input", "invalid", "submit"],
    //The onchange event occurs when a user changes the selected option of a <select> element
    selectEvents: ["change"],
    //blur and focus events
    //The onscroll event occurs when an element's scrollbar is being scrolled.
    //The onselect event occurs after some text has been selected in an element.
    //The selectstart event fires when the user starts to make a new text selection on a webpage.
    //The selectionchange event fires when the text selected on a webpage changes
    attentionEvents: ["blur", "focus", "scroll", "select", "selectstart", "selectionchange"],
    //The cancel event fires when the user indicates a wish to dismiss a <dialog>
    //The close event fires when the user closes a <dialog>.
    dialogEvents: ["cancel", "close"],
    //this tells us where the mouse is on the page at any given moment
    //very heavy load events with hundreds of events per second
    mouseLocationEvents: [
        "mouseenter", "mouseleave", "mousemove", 
        "mouseout", "mouseover", "pointermove", 
        "pointerover", "pointerout", "pointerenter",
        "pointerleave", "pointercancel", "pointerrawupdate"
    ],
    //The contextmenu event typically fires when the right mouse button is clicked on the window
    //The onsubmit event occurs when a form is submitted.
    //The ontoggle event occurs when the user opens or closes the <details> element.
    //The onwheel event occurs when the mouse wheel is rolled up or down over an element.
    //The auxclick event is raised when a non-primary button has been pressed on an input device (e.g., a middle mouse button).
    mouseActionEvents: [
        "click", "contextmenu", "dblclick", 
        "mousedown", "mouseup", "mousewheel", 
        "pointerdown", "pointerup", "toggle", 
        "wheel", "auxclick", "drag", 
        "dragend", "dragenter", "dragleave", 
        "dragover", "dragstart", "drop"
    ],
    //The onkeypress event occurs when the user presses a key (on the keyboard).
    //The onkeypress event is not fired for all keys (e.g. ALT, CTRL, SHIFT, ESC) in all browsers. 
    //To detect only whether the user has pressed a key, use the onkeydown event instead, because it works for all keys.
    keyboardEvents: ["keydown", "keypress", "keyup"],
    //The onpagehide event is sometimes used instead of the onunload event, as the onunload event causes the page to not be cached.
    //The onpageshow event is similar to the onload event, except that it occurs after the onload event when the page first loads. 
    //Also, the onpageshow event occurs every time the page is loaded, whereas the onload event does not occur when the page is loaded from the cache.
    browserWindowEvents: ["resize", "pagehide", "pageshow"]

};

var EventRecorder = {
    
    //SELECT MOUSE EVENTS FOR CONVERSION TO OBSERVABLES
    //we want to record location events so we know the state of any element BEFORE action occurs
    mouseLocationEventObervables: EventRecorderEvents.mouseLocationEvents
        //we are interested only in certain types of mouse location events
        .filter(item => item == "mouseover" || item == "mouseout")
        //we map each string array item to an observable
        .map(eventName => Rx.Observable.fromEvent(document, eventName)),
    //we want to record action events so we know when user action occurs
    mouseActionEventObervables: EventRecorderEvents.mouseActionEvents
        //then we are interested in only certain types of mouse events
        .filter(item => item == "click" || item == "contextmenu" || item == "dblclick" || item == 'mouseup' || item == "mousedown")
        //we map each string array item to an observable
        .map(eventName => Rx.Observable.fromEvent(document, eventName)),

    //SELECT INPUT EVENTS FOR CONVERSION TO OBSERVABLES
    inputLocationEventObservables: EventRecorderEvents.inputEvents
        //then we are only interests in certain types of input events
        .filter(item => item == "input")
        //we map each string array item to an observable
        .map(eventName => Rx.Observable.fromEvent(window, eventName)),
    inputActionEventObservables: EventRecorderEvents.inputEvents
        //then we are only interests in certain types of input events
        .filter(item => item == "change")
        //we map each string array item to an observable
        .map(eventName => Rx.Observable.fromEvent(window, eventName)),

    //SELECT CERTAIN ATTENTION EVENTS FOR CONVERSION TO OBSERVABLEs
    attentionActionEventObservables: EventRecorderEvents.attentionEvents
        //then we are interested in only certain types of attention events
        .filter(item => item == "selectstart" || item == "focus")
        //we map each string array item to an observable
        //attach a document-level listener with a third parameter of true to capture the focus events on all elements
        //tells the browser to capture the event on dispatch, even if that event does not normally bubble
        .map(eventName => Rx.Observable.fromEvent(document, eventName, true)),

    //SELECT SCROLL EVENTS FOR CONVERSION TO OBSERVABLEs
    scrollActionEventObservables: EventRecorderEvents.attentionEvents
        //then we are interested in only certain types of attention events
        .filter(item => item == "scroll")
        //we map each string array item to an observable
        //attach a document-level listener with a third parameter of true to capture the scroll events on all elements
        //tells the browser to capture the event on dispatch, even if that event does not normally bubble
        .map(eventName => Rx.Observable.fromEvent(document, eventName, true)),

    //SELECT KEYBOARD EVENTS FOR CONVERSION TO OBSERVABLES
    keyBoardActionEventObservables: EventRecorderEvents.keyboardEvents
        //then we are interested in only certain types of mouse events
        .filter(item => item == "keydown" || item == "keyup")
        //we map each string array item to an observable
        .map(eventName => Rx.Observable.fromEvent(document, eventName)),

    //we need to have an instance of the key code dictionary
    keyCodeDictionary: new KeyCodeDictionary({}),
    //we need to have instance of CSS selector generator class instantiated at the time of creation
    cssSelectorClass: new CssSelectorGenerator,
    //then we need a function that returned the CSS selector path
    getCssSelectorPath: element => EventRecorder.cssSelectorClass.getSelector(element),
    //then we get a function that returns the CSS optimal selector - again we relegate id here to last place
    getOptimalSelectPath: element => OptimalSelect.select(element, {priority: ['class', 'href', 'src', 'id']}),
    //then a function that returns the Finder CSS selector - without ID but using attributes, add a threshold to speed it up, the lower the faster
    getRecordReplayPath: element => window.recordReplaySelectorGenerator(element),
    //then a fallback function for fails, using the very fast dompath
    getCssDomPath: element => { const path = new dompath(element); return path.toCSS(); },
    //then our own basic function that returns xpath of element
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
     },
     domToJSON: node => {
        //use the supplied node or the entire document if no node supplied
        node = node || document.documentElement;
        //this is the starter object, which has the nodetype
        var obj = { nodeType: node.nodeType};
        //if the node has a tag then set the tag name, otherwise set the node name 
        if (node.tagName) { obj.tagName = node.tagName.toLowerCase(); } 
        else if (node.nodeName) { obj.nodeName = node.nodeName; }
        //if the node has a value then add that as well
        if (node.nodeValue) { obj.nodeValue = node.nodeValue; }
        //get the attributes as an array
        var attrs = node.attributes;
        //if there are any attributes, we need to add them to the object
        if (attrs) {
            //get the length for the loop
            var length = attrs.length;
            //create an array with the length of the attributes and allocate to obj.attributes property
            var arr = obj.attributes = new Array(length);
            //loop through the attributes 
            for (var i = 0; i < length; i++) {
                //get the attribute from the attributes array
                attr = attrs[i];
                //then push into the object.attributes array
                arr[i] = [attr.nodeName, attr.nodeValue];
            }
        }
        //see if we have any childnodes, returned as an array
        var childNodes = node.childNodes;
        //if we have any childnodes, we also want to follow the same process
        if (childNodes) {
            //get the length of the array for the loop
            length = childNodes.length;
            //create the new array and allocate to the childnodes property
            arr = obj.childNodes = new Array(length);
            //loop through the childnodes array
            for (i = 0; i < length; i++) {
                //for each child node we recursively call this function until we reach a point where there are no childnodes left
                arr[i] = EventRecorder.domToJSON(childNodes[i]);
            }
        }
        //once we have run out of childnodes we can then return the json object
        return obj;
    },
    //send message according to the enviroment
    sendEvent: recordingEvent => {
        //just the standard message passing from extension - all listeners to these events are asynchronous so don't evpect a response
        chrome.runtime.sendMessage({recordingEvent: recordingEvent});
    },
    //we need to know if we are in an iframe - has implications right through the application
    contextIsIframe: () => { 
        try { return window.self !== window.top; } 
        catch (e) { return true; } 
    },
    //we should always be in the context of a content script
    contextIsContentScript: () => { return typeof chrome.runtime.getManifest != 'undefined' },
    //we need to know if the element is an input element
    elementIsInput: (element) => element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement  || element.isContentEditable,
    //then we can do a timed function to measure the performance of CSS selector generators on mouse moves
    timed: (f) => (...args) => {
        let start = performance.now();
        let ret = f(...args);
        let timeTaken = performance.now()-start;
        timeTaken > 20 ? console.log(`Performance Report: function ${f.name} took ${timeTaken.toFixed(3)}ms`) : null;
        return ret;   
    },
    //we need an array for testing purposes
    testingEventsArray: []

    
}

EventRecorder.startRecordingEvents = () => {

    //ALL OF OUR SEPARATE EVENTS REQUIRE AN UNADULTERATED LOCATOR that generates css selectors BEFORE ACTION
    //just a quick routine for working out timings
    //we only attach this to the mouselocator as that it going to be the heaviest load
    const cssSelectorTimed = EventRecorder.timed(EventRecorder.getCssSelectorPath)
    const optimalSelectTimed = EventRecorder.timed(EventRecorder.getOptimalSelectPath)
    const recordReplayTimed = EventRecorder.timed(EventRecorder.getRecordReplayPath)
    const dompathTimed = EventRecorder.timed(EventRecorder.getCssDomPath)
    const xpathTimed = EventRecorder.timed(EventRecorder.getXPath)

    //so we query the latest mouse location, which we collect by referring to the mouseover events
    EventRecorder.MouseLocator = Rx.Observable.merge(...EventRecorder.mouseLocationEventObervables)
        //the mouse location observables are many - we currently only want the mouseover events
        .filter(event => event.type == "mouseover")
        //throttle but emit trailing value after time period
        .throttleTime(750, Rx.Scheduler.async, {leading: true, trailing: true})
        //then we want to add a quick xpath calculation to the event so we can work out if we have a unqiue element
        .map(event => ({ event: event, xpath: xpathTimed(event.target) }))
        //then we only want to be taking elements that are unique as the css calculation can take a while, at least the CSS selector generator
        .distinctUntilChanged((prev, curr) => prev.xpath === curr.xpath)
        //then if we have a fresh element we want to map back to the event
        .map(eventObject => eventObject.event)
        //log so we can see what's going on
        //.do(x => console.log( x.target.offsetTop, x.target.offsetLeft))
        //then we get the selectors for the pre-action event element, so it is not mutated
        .map(event => {
            return {
                eventTarget: event.target,
                eventCssSelectorPath: cssSelectorTimed(event.target),
                eventCssOptimalPath: optimalSelectTimed(event.target),
                eventRecordReplayPath: recordReplayTimed(event.target) || dompathTimed(event.target),
                eventXPath: xpathTimed(event.target)
            }
        })
        //then it's very important that we share this one as three users currently and it is computationally costly
        .share();

    //then we also query the latest input location, which we collect by referring to the input events
    EventRecorder.InputLocator = Rx.Observable.merge(...EventRecorder.inputLocationEventObservables)
        //the input location observables are many - we currently only want the input events
        .filter(event => event.type == "input")
        //then log for useful debugging
        //.do(x => console.log(x))
        //then we get the selectors for the pre-action event element, so it is not mutated
        .map(event => {
            return {
                eventCssSelectorPath: EventRecorder.getCssSelectorPath(event.target),
                eventCssOptimalPath: EventRecorder.getOptimalSelectPath(event.target),
                eventRecordReplayPath: EventRecorder.getRecordReplayPath(event.target) || EventRecorder.getCssDomPath(event.target),
                eventXPath: EventRecorder.getXPath(event.target)
            }
        });
    
    //then we also query the latest focus location, which we collect by referring to attention events
    EventRecorder.FocusLocator = Rx.Observable.merge(...EventRecorder.attentionActionEventObservables)
        //the attention observables are many - we currently only want the focus events
        .filter(event => event.type == "focus")
        //then log for useful debugging
        //.do(x => console.log(x))
        //then we get the selectors for the pre-action event element, so it is not mutated
        .map(event => {
            return {
                eventTarget: event.target,
                eventCssSelectorPath: EventRecorder.getCssSelectorPath(event.target),
                eventCssOptimalPath: EventRecorder.getOptimalSelectPath(event.target),
                eventRecordReplayPath: EventRecorder.getRecordReplayPath(event.target) || EventRecorder.getCssDomPath(event.target),
                eventXPath: EventRecorder.getXPath(event.target)
            }
        });
    
    //TEXT SELECT EVENTS
    //as we do not have a select end event, we have to construct one
    //and we need to name this as it is used to prevent double recordings of text selection and clicks
    EventRecorder.textSelectionObservable = Rx.Observable.merge(...EventRecorder.attentionActionEventObservables)
        //the selection observables are many - we currently only want the select start event
        .filter(event => event.type == "selectstart")
        //once we have a selectStart event, we then need to start listening to the mouseup event to work out when selection has finished
        .switchMap( () =>
            Rx.Observable.merge(...EventRecorder.mouseActionEventObervables).filter(event => event.type == "mouseup").take(1),
            //then we need a projection function to make sure we get only actionable information
            (selectEvent, mouseUpEvent) => {
                //get the current selection in the window to check that some text has been highlighted
                const selection = window.getSelection()
                //then return an object with properties that we need to filter and also to process a recording event
                return {
                    //we keep the event type although it's not selectStart that we are creating
                    eventType: selectEvent.type,
                    //we need the current selection as a string so we can filter zero selections
                    selectionString: selection.toString(),
                    //then we need to have the mouseup event so we can process the location of the selection
                    mouseEvent: mouseUpEvent
                }
        })
        //then filter for empty strings as that's an indication that the user either pressed on the contextMenu or changed their mind
        .filter(selectEndObject => selectEndObject.selectionString.length > 0)
        //then process selectEndObject into a recording object
        .map(selectEndObject => {
            const newEvent = new RecordingEvent({
                //general properties
                recordingEventAction: 'TextSelect',
                recordingEventActionType: selectEndObject.eventType,
                recordingEventHTMLElement: selectEndObject.mouseEvent.target.constructor.name,
                recordingEventHTMLTag: selectEndObject.mouseEvent.target.tagName,
                recordingEventCssSelectorPath: EventRecorder.getCssSelectorPath(selectEndObject.mouseEvent.target),
                recordingEventCssDomPath: EventRecorder.getOptimalSelectPath(selectEndObject.mouseEvent.target),
                recordingEventCssFinderPath: EventRecorder.getRecordReplayPath(selectEndObject.mouseEvent.target) || EventRecorder.getCssDomPath(selectEndObject.mouseEvent.target),
                recordingEventXPath: EventRecorder.getXPath(selectEndObject.mouseEvent.target),
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: window.location.href,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                //information specific to text select events
                recordingEventTextSelectTextContent: selectEndObject.selectionString,
                recordingEventTextSelectTargetAsJSON: EventRecorder.domToJSON(selectEndObject.mouseEvent.target)
            });
            return newEvent;
        });

    
    //MOUSE EVENTS
    
    //MOUSE CLICK EVENTS
    EventRecorder.mouseObservable = Rx.Observable.merge(...EventRecorder.mouseActionEventObervables)
        //we don't care about mouseup or mousedown events here as we're covered with the click event
        .filter(event => event.type != "mouseup" && event.type != "mousedown")
        //there is no point in recording mouse clicks in HTMLInputElement, HTMLTextAreaElement and isContentEditable elements - we use the input change event for that
        .filter(event => EventRecorder.elementIsInput(event.target) == false)
        //then as each action occurs, we want to know the state of the element BEFORE the action took place
        .withLatestFrom(EventRecorder.MouseLocator, EventRecorder.textSelectionObservable.startWith({recordingEventCssSelectorPath: null}))
        //then map the event to the Recording Event type
        .map(([actionEvent, locationEvent, currentTextSelection]) => {
            //create our event
            const newEvent = new RecordingEvent({
                recordingEventAction: 'Mouse',
                recordingEventActionType: actionEvent.type,
                recordingEventHTMLElement: actionEvent.target.constructor.name,
                recordingEventHTMLTag: actionEvent.target.tagName,
                recordingEventCssSelectorPath: locationEvent.eventCssSelectorPath,
                recordingEventCssDomPath: locationEvent.eventCssOptimalPath,
                recordingEventCssFinderPath: locationEvent.eventRecordReplayPath,
                recordingEventXPath: locationEvent.eventXPath,
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: window.location.href,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
            });
            //then only return the event if the same element has not recorded a text selection event
            if (currentTextSelection.recordingEventCssSelectorPath != newEvent.recordingEventCssSelectorPath) {
                return newEvent;
            } else { 
                //if we have filtered it out then we need to report
                console.log("Click Event Ignored As Action on Element is being Recorded as Text Selection Event");
                //just return an empty observable as a placeholder which we can easily filter out
                return false; 
            }
        })
        //then a simple filter to ensure that the double counting events do not make it through to the final output
        .filter(object => object != false);
    

    //MOUSE HOVER EVENTS
    EventRecorder.mouseHoverObservable = EventRecorder.MouseLocator
        //Get the time of the mouseover event - this moves the mouselocator event to the value key of an object and adds a timestamp key as well with milliseconds
        .timestamp()
        //Don't emit until the mouseOut triggers
        .sample(Rx.Observable.merge(...EventRecorder.mouseLocationEventObervables).filter(event => event.type == "mouseout"))
        //Get a new timestamp (remember this is *after* mouse out) - this moves the mouselocator to a second level, referred by value so the mouselocator event is value.value.x 
        .timestamp()
        //then allow through only those events that have a delay of more than 3000
        .filter(timeStampedLayeredObject => timeStampedLayeredObject.timestamp - timeStampedLayeredObject.value.timestamp > 3000)
        //then map it to the MouseLocator event again
        .map(timeStampedLayeredObject => timeStampedLayeredObject.value.value)
        //then create a recording event
        .map(mouseLocatorEvent => {
            const newEvent = new RecordingEvent({
                //general properties
                recordingEventAction: 'Mouse',
                recordingEventActionType: 'hover',
                recordingEventHTMLElement: mouseLocatorEvent.eventTarget.constructor.name,
                recordingEventHTMLTag: mouseLocatorEvent.eventTarget.tagName,
                recordingEventCssSelectorPath: mouseLocatorEvent.eventCssSelectorPath,
                recordingEventCssDomPath: mouseLocatorEvent.eventCssOptimalPath,
                recordingEventCssFinderPath: mouseLocatorEvent.eventRecordReplayPath,
                recordingEventXPath: mouseLocatorEvent.eventXPath,
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: window.location.href,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                //information specific to text select events
                recordingEventHoverTargetAsJSON: EventRecorder.domToJSON(mouseLocatorEvent.eventTarget)
            });
            return newEvent;
        });
    

    //MOUSE RECAPTCHA EVENTS
    EventRecorder.mouseRecaptchaObservable = Rx.Observable.merge(...EventRecorder.mouseActionEventObervables)
        //we only care about mousedown events here - the click event does not work for listening to recaptchas
        .filter(event => event.type == "mousedown")
        //then we only care about events in iframes as the recaptcha is served via the iframe
        .filter(() => EventRecorder.contextIsIframe())
        //then we only care about iframes served by google
        .filter(() => window.location.origin == "https://www.google.com")
        //then we only care about recaptcha urls
        .filter(() => window.location.href.includes("recaptcha"))
        //then as each action occurs, we want to know the state of the element BEFORE the action took place
        .withLatestFrom(EventRecorder.MouseLocator)
        //then map the event to the Recording Event type
        .map(([actionEvent, locationEvent]) => {
            //create our event
            const newEvent = new RecordingEvent({
                recordingEventAction: 'Mouse',
                recordingEventActionType: 'recaptcha',
                recordingEventHTMLElement: actionEvent.target.constructor.name,
                recordingEventHTMLTag: actionEvent.target.tagName,
                recordingEventCssSelectorPath: locationEvent.eventCssSelectorPath,
                recordingEventCssDomPath: locationEvent.eventCssOptimalPath,
                recordingEventCssFinderPath: locationEvent.eventRecordReplayPath,
                recordingEventXPath: locationEvent.eventXPath,
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: window.location.href,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
            });
            return newEvent;
        });


    //INPUT EVENTS
    EventRecorder.inputObservable = Rx.Observable.merge(
            //we need to have the normal input observables
            Rx.Observable.merge(...EventRecorder.inputActionEventObservables),
            //but then we also need to pick up blur changes from the whole document for contenteditable elements, with true set so we can listen to event dispatch
            Rx.Observable.fromEvent(document, "blur", true).filter(event => event.target.isContentEditable)
        )   
        //then as each action occurs, we want to know the state of the element BEFORE the action took place
        .withLatestFrom(EventRecorder.InputLocator)
        //then map the event to the Recording Event type
        .map(([actionEvent, locationEvent]) => {
            //we need to be sensitive to contenteditable events here, as the method of retrieving the value is different
            let inputType, inputValue;
            //if the element is a contentEditable element then we have to use set the special input type and use textContent
            if (actionEvent.target.isContentEditable) {
                //add the special label for content editable actions
                actionType = 'Content Edit'
                //give the special label for contenteditable type so we can distinguish
                inputType = 'contentEditable'
                //then we go for the textcontent as the value of a contenteditable div, for example, is meaningless
                //we trim the text here for presentation purposes - we do not assert on input elements so stripping whitespace and special characters should not cause problems
                inputValue = actionEvent.target.textContent.trim(); 
            }
            //if the element is an input element or a text area element then we can just use the normal action type, input type and value
            if (actionEvent.target instanceof HTMLInputElement || actionEvent.target instanceof HTMLTextAreaElement) { 
                actionType = actionEvent.type;
                inputType = actionEvent.target.type;
                inputValue = actionEvent.target.value; 
            }
            //then create the new event
            const newEvent = new RecordingEvent({
                //general properties
                recordingEventAction: 'Input',
                recordingEventActionType: actionType,
                recordingEventHTMLElement: actionEvent.target.constructor.name,
                recordingEventHTMLTag: actionEvent.target.tagName,
                recordingEventCssSelectorPath: locationEvent.eventCssSelectorPath,
                recordingEventCssDomPath: locationEvent.eventCssOptimalPath,
                recordingEventCssFinderPath: locationEvent.eventRecordReplayPath,
                recordingEventXPath: locationEvent.eventXPath,
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: window.location.href,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                //information specific to input events
                recordingEventInputType: inputType,
                recordingEventInputValue: inputValue,
            });
            return newEvent;
        });
    
    //KEYBOARD EVENTS
    EventRecorder.keyboardObservable = Rx.Observable.merge(...EventRecorder.keyBoardActionEventObservables)
        //then we only want the keyup event - we have chosen this as we want keyboard enter and tab events after any input events have registered, which happens on keydown
        .filter(event => event.type == "keyup")
        //then we want to make sure that we do not get the modifier keys - the state of these is collected as part of the keystroke
        .filter(event => event.key != "Shift" && event.key != "Alt" && event.key != "Control")
        //then we want to get the current focus event locator, starting with an empty object so we can test to see if focus event has emitted
        .withLatestFrom(EventRecorder.FocusLocator.startWith({}))
        //then combine the two observables properties to create our RecordingEvent object
        .map( ([actionEvent, focusEvent]) => {
            //lets get some information about the key that has been pressed
            const keyInfoObject = EventRecorder.keyCodeDictionary[actionEvent.keyCode];
            const descriptor = keyInfoObject.descriptor;
            //there is no point in recording text typing in HTMLInputElement, HTMLTextAreaElement and isContentEditable elements - we use the input change event for that
            if (keyInfoObject.value != null && EventRecorder.elementIsInput(actionEvent.target)) {
                console.log(`Keyboard: Not Recording Typed "${actionEvent.key}" on HTMLInputElement, HTMLTextAreaElement or isContentEditable Element`);
                //just return an empty observable as a placeholder which we can easily filter out
                return false;
            }
            //there is no point in recording text editing in HTMLInputElement, HTMLTextAreaElement and isContentEditable elements - we use the input change event for that
            if ((descriptor == "Backspace" || descriptor == "Insert" || descriptor == "Delete") && EventRecorder.elementIsInput(actionEvent.target)) {
                console.log(`Keyboard: Not Recording Text Editing Key "${descriptor}" on HTMLInputElement, HTMLTextAreaElement or isContentEditable Element`);
                //just return an empty observable as a placeholder which we can easily filter out
                return false;
            }
            //there is no point in recording text navigation in HTMLInputElement, HTMLTextAreaElement and isContentEditable elements - we use the input change event for that
            //at the moment we only assume ArrowLeft and ArrowRight as text navigation - up and down can be used to select dropdown elements
            if ((descriptor == "ArrowLeft" || descriptor == "ArrowRight") && EventRecorder.elementIsInput(actionEvent.target)) {
                console.log(`Keyboard: Not Recording Text Navigation Key "${descriptor}" on HTMLInputElement, HTMLTextAreaElement or isContentEditable Element`);
                //just return an empty observable as a placeholder which we can easily filter out
                return false;
            }
            const newEvent = new RecordingEvent({
                //general properties
                recordingEventAction: 'Keyboard',
                recordingEventActionType: actionEvent.key,
                recordingEventHTMLElement: actionEvent.target.constructor.name,
                recordingEventHTMLTag: actionEvent.target.tagName,
                recordingEventCssSelectorPath: focusEvent.eventCssSelectorPath || EventRecorder.getCssSelectorPath(actionEvent.target),
                recordingEventCssDomPath: focusEvent.eventCssOptimalPath || EventRecorder.getOptimalSelectPath(actionEvent.target),
                recordingEventCssFinderPath: focusEvent.eventRecordReplayPath || EventRecorder.getRecordReplayPath(actionEvent.target) || EventRecorder.getCssDomPath(actionEvent.target),
                recordingEventXPath: focusEvent.eventXPath || EventRecorder.getXPath(actionEvent.target),
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: window.location.href,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                //information specific to keyboard events
                recordingEventKey: actionEvent.key,
                recordingEventCode: actionEvent.code,
                recordingEventKeyCode: actionEvent.keyCode,
                recordingEventDispatchKeyEvent: EventRecorder.keyCodeDictionary.generateDispatchKeyEvent(actionEvent)
            });
            return newEvent;
        })
        //then a simple filter to ensure that the keyboard events on input element do not make it through to the final output
        .filter(object => object != false);
    
    //SCROLL EVENTS
    EventRecorder.scrollObservable = Rx.Observable.merge(...EventRecorder.scrollActionEventObservables)
        //then we are interested only in scroll events
        .filter(event => event.type == "scroll")
        //then for the time being we only want to record scroll events on the document element
        .filter(event => event.target instanceof HTMLDocument)
        //then we only want to get the last event after scrolling has stopped for 1/2 second - longer and the scroll events can occur after the click that should follow
        .debounceTime(500)
        //then we need to translate that event into something that can be repeated so we need the x and y co-ordinates and the given scrolling element
        .map(actionEvent => {
            const newEvent = new RecordingEvent({
                //general properties
                recordingEventAction: 'Scroll',
                recordingEventActionType: `x: ${Math.round(actionEvent.target.scrollingElement.scrollLeft)}, y: ${Math.round(actionEvent.target.scrollingElement.scrollTop)}`,
                recordingEventHTMLElement: actionEvent.target.constructor.name,
                recordingEventHTMLTag: actionEvent.target.scrollingElement.tagName,
                recordingEventCssSelectorPath: EventRecorder.getCssSelectorPath(actionEvent.target.scrollingElement),
                recordingEventCssOptimalPath: EventRecorder.getOptimalSelectPath(actionEvent.target.scrollingElement),
                recordingEventCssFinderPath: EventRecorder.getRecordReplayPath(actionEvent.target.scrollingElement) || EventRecorder.getCssDomPath(actionEvent.target.scrollingElement),
                recordingEventXPath: EventRecorder.getXPath(actionEvent.target.scrollingElement),
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: window.location.href,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                //information specific to scroll events
                recordingEventXPosition: Math.round(actionEvent.target.scrollingElement.scrollLeft),
                recordingEventYPosition: Math.round(actionEvent.target.scrollingElement.scrollTop),
            });
            return newEvent;
        });
    
    //SCROLL ITEM EVENTS
    EventRecorder.scrollItemObservable = Rx.Observable.merge(...EventRecorder.scrollActionEventObservables)
        //then we are interested only in scroll events
        .filter(event => event.type == "scroll")
        //then for the time being we only want to record scroll events on the document element
        .filter(event => event.target instanceof HTMLDocument == false)
        //then we only want to get the last event after scrolling has stopped for 1/2 second - longer and the scroll events can occur after the click that should follow
        .debounceTime(500)
        //then we need to translate that event into something that can be repeated so we need the x and y co-ordinates and the given scrolling element
        .map(actionEvent => {
            const newEvent = new RecordingEvent({
                //general properties
                recordingEventAction: 'ElementScroll',
                recordingEventActionType: `x: ${Math.round(actionEvent.target.scrollLeft)}, y: ${Math.round(actionEvent.target.scrollTop)}`,
                recordingEventHTMLElement: actionEvent.target.constructor.name,
                recordingEventHTMLTag: actionEvent.target.tagName,
                recordingEventCssSelectorPath: EventRecorder.getCssSelectorPath(actionEvent.target),
                recordingEventCssDomPath: EventRecorder.getOptimalSelectPath(actionEvent.target),
                recordingEventCssFinderPath: EventRecorder.getRecordReplayPath(actionEvent.target) || EventRecorder.getCssDomPath(actionEvent.target),
                recordingEventXPath: EventRecorder.getXPath(actionEvent.target),
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: window.location.href,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                //information specific to scroll events
                recordingEventXPosition: Math.round(actionEvent.target.scrollLeft),
                recordingEventYPosition: Math.round(actionEvent.target.scrollTop),
            });
            return newEvent;
        });

    //combine all our observables into a single subscription
    Rx.Observable.merge(
        //handles all text selection
        EventRecorder.textSelectionObservable, 
        //handles all mouse actions,
        EventRecorder.mouseObservable, 
        //handles mouse hover events
        EventRecorder.mouseHoverObservable,
        //handles Google recaptcha events
        EventRecorder.mouseRecaptchaObservable,
        //handles all input from user
        EventRecorder.inputObservable,
        //handles all non-typing keyboard actions
        EventRecorder.keyboardObservable,
        //handles all window scroll events
        EventRecorder.scrollObservable,
        //handles all element scroll events
        EventRecorder.scrollItemObservable
    )
    //and log the output  
    .subscribe(recordingEvent => {
        //if we are not running in the extension testing environment, log the event and send the message
        if (window.location.href != chrome.runtime.getURL('index.html')) {
            //we need to see the events so we can check that the recorder is working properly in all contexts
            console.log(recordingEvent);
            EventRecorder.sendEvent(recordingEvent);
        } else {
            //otherwise, we just log the stringified event
            console.log(recordingEvent);
            //then push to the array
            EventRecorder.testingEventsArray.push(recordingEvent);
        }
    });

}

//START FUNCTION
//WE ONLY WANT TO START IN IFRAME OR CONTENT SCRIPT CONTEXT
//IF THIS IS INJECTED INTO MAIN FRAME BY DEBUGGER, WE WILL HAVE DOUBLE REPORTING
switch(true) {
    //if we are an iframe we need to report and start
    case EventRecorder.contextIsIframe():
        console.log(`%cEvent Recorder activated via Content Script in iframe with origin ${window.location.origin}`, 'color: green');
        EventRecorder.startRecordingEvents();
        break;
    case EventRecorder.contextIsContentScript():
        console.log(`%cEvent Recorder activated via Content Script in main frame with origin ${window.location.origin}`, 'color: blue');
        EventRecorder.startRecordingEvents();
        break;
    default:
        console.log(`%cEvent Recorder NOT activated in main frame with origin ${window.location.origin}`, 'color: dimgrey');
}

