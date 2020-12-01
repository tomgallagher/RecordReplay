//A LIST OF ALL WINDOW EVENTS FOR TOTAL USER INTERACTION COVERAGE
var EventRecorderEvents = {
    //The onsearch event occurs when a user presses the "ENTER" key or clicks the "x" button in an <input> element with type="search"
    //The oninput event occurs when an element gets user input - similar to the onchange event. The difference is that the oninput event
    //occurs immediately after the value of an element has changed, while onchange occurs when the element loses focus, after the content has been changed.
    //The oninvalid event occurs when a submittable <input> element is invalid.
    inputEvents: ['search', 'change', 'input', 'invalid', 'submit'],
    //The onchange event occurs when a user changes the selected option of a <select> element
    selectEvents: ['change'],
    //blur and focus events
    //The onscroll event occurs when an element's scrollbar is being scrolled.
    //The onselect event occurs after some text has been selected in an element.
    //The selectstart event fires when the user starts to make a new text selection on a webpage.
    //The selectionchange event fires when the text selected on a webpage changes
    attentionEvents: ['blur', 'focus', 'scroll', 'select', 'selectstart', 'selectionchange'],
    //The cancel event fires when the user indicates a wish to dismiss a <dialog>
    //The close event fires when the user closes a <dialog>.
    dialogEvents: ['cancel', 'close'],
    //this tells us where the mouse is on the page at any given moment
    //very heavy load events with hundreds of events per second
    mouseLocationEvents: [
        'mouseenter',
        'mouseleave',
        'mousemove',
        'mouseout',
        'mouseover',
        'pointermove',
        'pointerover',
        'pointerout',
        'pointerenter',
        'pointerleave',
        'pointercancel',
        'pointerrawupdate',
    ],
    //The contextmenu event typically fires when the right mouse button is clicked on the window
    //The onsubmit event occurs when a form is submitted.
    //The ontoggle event occurs when the user opens or closes the <details> element.
    //The onwheel event occurs when the mouse wheel is rolled up or down over an element.
    //The auxclick event is raised when a non-primary button has been pressed on an input device (e.g., a middle mouse button).
    mouseActionEvents: [
        'click',
        'contextmenu',
        'dblclick',
        'mousedown',
        'mouseup',
        'mousewheel',
        'pointerdown',
        'pointerup',
        'toggle',
        'wheel',
        'auxclick',
        'drag',
        'dragend',
        'dragenter',
        'dragleave',
        'dragover',
        'dragstart',
        'drop',
    ],
    //The onkeypress event occurs when the user presses a key (on the keyboard).
    //The onkeypress event is not fired for all keys (e.g. ALT, CTRL, SHIFT, ESC) in all browsers.
    //To detect only whether the user has pressed a key, use the onkeydown event instead, because it works for all keys.
    keyboardEvents: ['keydown', 'keypress', 'keyup'],
    //The onpagehide event is sometimes used instead of the onunload event, as the onunload event causes the page to not be cached.
    //The onpageshow event is similar to the onload event, except that it occurs after the onload event when the page first loads.
    //Also, the onpageshow event occurs every time the page is loaded, whereas the onload event does not occur when the page is loaded from the cache.
    browserWindowEvents: ['resize', 'pagehide', 'pageshow'],
};

var EventRecorder = {
    //SELECT MOUSE EVENTS FOR CONVERSION TO OBSERVABLES
    //we want to record location events so we know the state of any element BEFORE action occurs
    mouseLocationEventObervables: EventRecorderEvents.mouseLocationEvents
        //we are interested only in certain types of mouse location events
        .filter((item) => item == 'mouseover' || item == 'mouseout')
        //we map each string array item to an observable
        .map((eventName) => Rx.Observable.fromEvent(document, eventName)),
    //we want to record action events so we know when user action occurs
    mouseActionEventObervables: EventRecorderEvents.mouseActionEvents
        //then we are interested in only certain types of mouse events
        .filter(
            (item) =>
                item == 'click' ||
                item == 'contextmenu' ||
                item == 'dblclick' ||
                item == 'mouseup' ||
                item == 'mousedown'
        )
        //we map each string array item to an observable
        .map((eventName) => Rx.Observable.fromEvent(document, eventName)),

    //SELECT INPUT EVENTS FOR CONVERSION TO OBSERVABLES
    inputLocationEventObservables: EventRecorderEvents.attentionEvents
        //then we are only interests in certain types of input events
        .filter((item) => item == 'focus')
        //we map each string array item to an observable
        .map((eventName) => Rx.Observable.fromEvent(window, eventName, true)),
    inputActionEventObservables: EventRecorderEvents.inputEvents
        //then we are only interests in certain types of input events
        .filter((item) => item == 'change')
        //we map each string array item to an observable
        .map((eventName) => Rx.Observable.fromEvent(window, eventName)),

    //SELECT CERTAIN ATTENTION EVENTS FOR CONVERSION TO OBSERVABLEs
    attentionActionEventObservables: EventRecorderEvents.attentionEvents
        //then we are interested in only certain types of attention events
        .filter((item) => item == 'selectstart' || item == 'focus')
        //we map each string array item to an observable
        //attach a document-level listener with a third parameter of true to capture the focus events on all elements
        //tells the browser to capture the event on dispatch, even if that event does not normally bubble
        .map((eventName) => Rx.Observable.fromEvent(document, eventName, true)),

    //SELECT SCROLL EVENTS FOR CONVERSION TO OBSERVABLEs
    scrollActionEventObservables: EventRecorderEvents.attentionEvents
        //then we are interested in only certain types of attention events
        .filter((item) => item == 'scroll')
        //we map each string array item to an observable
        //attach a document-level listener with a third parameter of true to capture the scroll events on all elements
        //tells the browser to capture the event on dispatch, even if that event does not normally bubble
        .map((eventName) => Rx.Observable.fromEvent(document, eventName, true)),

    //SELECT KEYBOARD EVENTS FOR CONVERSION TO OBSERVABLES
    keyBoardActionEventObservables: EventRecorderEvents.keyboardEvents
        //then we are interested in only certain types of mouse events
        .filter((item) => item == 'keydown' || item == 'keyup')
        //we map each string array item to an observable
        .map((eventName) => Rx.Observable.fromEvent(document, eventName)),

    //SELECT FILE DROP EVENTS FOR CONVERSION TO OBSERVABLES
    fileDropActionEventObservables: EventRecorderEvents.mouseActionEvents
        //then we are interested in only certain types of mouse events
        .filter((item) => item == 'drop')
        //we map each string array item to an observable
        .map((eventName) => Rx.Observable.fromEvent(document, eventName, true)),

    //we need to have an instance of the key code dictionary
    keyCodeDictionary: new KeyCodeDictionary({}),
    //we need to have instance of CSS selector generator class instantiated at the time of creation
    cssSelectorClass: new CssSelectorGenerator(),
    //then we need a function that returned the CSS selector path
    getCssSelectorPath: (element) => EventRecorder.cssSelectorClass.getSelector(element),
    //then we get a function that returns the CSS optimal selector - again we relegate id here to last place
    getOptimalSelectPath: (element) => OptimalSelect.select(element, { priority: ['class', 'href', 'src', 'id'] }),
    //then a function that returns the Finder CSS selector - without ID but using attributes, add a threshold to speed it up, the lower the faster
    getRecordReplayPath: (element) => window.recordReplaySelectorGenerator(element),
    //then a fallback function for fails, using the very fast dompath
    getCssDomPath: (element) => {
        const path = new dompath(element);
        return path.toCSS();
    },
    //then add fallback to each of the selector functions - we do not want to have blank selectors EVER, as that leads to errors in content scripts that can be hard to track
    getCssSelectorPathWithFailover: (element) =>
        EventRecorder.getCssSelectorPath(element) || EventRecorder.getCssDomPath(element),
    getOptimalSelectPathWithFailover: (element) =>
        EventRecorder.getOptimalSelectPath(element) || EventRecorder.getCssDomPath(element),
    getRecordReplayPathWithFailover: (element) =>
        EventRecorder.getRecordReplayPath(element) || EventRecorder.getCssDomPath(element),
    //then our own basic function that returns xpath of element
    getXPath: (element) => {
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
                for (var n = 0; n < allNodes.length; n++) {
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
                    if (sib.localName == element.localName) i++;
                }
                //just push the local name into the array along with the position
                segs.unshift(element.localName.toLowerCase() + '[' + i + ']');
            }
        }
        //then once we've worked our way up to an element with id or we are at the element with no parentNode - the html - we return all the strings joined with a backslash
        return segs.length ? '/' + segs.join('/') : null;
    },
    domToJSON: (node) => {
        //use the supplied node or the entire document if no node supplied
        node = node || document.documentElement;
        //this is the starter object, which has the nodetype
        var obj = { nodeType: node.nodeType };
        //if the node has a tag then set the tag name, otherwise set the node name
        if (node.tagName) {
            obj.tagName = node.tagName.toLowerCase();
        } else if (node.nodeName) {
            obj.nodeName = node.nodeName;
        }
        //if the node has a value then add that as well
        if (node.nodeValue) {
            obj.nodeValue = node.nodeValue;
        }
        //get the attributes as an array
        var attrs = node.attributes;
        //if there are any attributes, we need to add them to the object
        if (attrs) {
            //get the length for the loop
            var length = attrs.length;
            //create an array with the length of the attributes and allocate to obj.attributes property
            var arr = (obj.attributes = new Array(length));
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
    sendEvent: (recordingEvent) => {
        //just the standard message passing from extension - all listeners to these events are asynchronous so don't evpect a response
        chrome.runtime.sendMessage({ recordingEvent: recordingEvent });
    },
    //we need to know if we are in an iframe - has implications right through the application
    contextIsIframe: () => {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    },
    //we should always be in the context of a content script
    contextIsContentScript: () => {
        return typeof chrome.runtime.getManifest != 'undefined';
    },
    //we need to know if the element is an input element
    elementIsInput: (element) =>
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement ||
        element.isContentEditable,
    //then we can do a timed function to measure the performance of CSS selector generators on mouse moves
    timed: (f) => (...args) => {
        let start = performance.now();
        let ret = f(...args);
        let timeTaken = performance.now() - start;
        timeTaken > 20 ? console.log(`Performance Report: function ${f.name} took ${timeTaken.toFixed(3)}ms`) : null;
        return ret;
    },
    //we need an array for testing purposes
    testingEventsArray: [],
};

EventRecorder.startRecordingEvents = () => {
    //ALL OF OUR SEPARATE EVENTS REQUIRE AN UNADULTERATED LOCATOR that generates css selectors BEFORE ACTION
    //just a quick routine for working out timings
    //we only attach this to the mouselocator as that it going to be the heaviest load
    const cssSelectorTimed = EventRecorder.timed(EventRecorder.getCssSelectorPathWithFailover);
    const optimalSelectTimed = EventRecorder.timed(EventRecorder.getOptimalSelectPathWithFailover);
    const recordReplayTimed = EventRecorder.timed(EventRecorder.getRecordReplayPathWithFailover);
    const xpathTimed = EventRecorder.timed(EventRecorder.getXPath);

    //so we query the latest mouse location, which we collect by referring to the mouseover events
    EventRecorder.MouseLocator = Rx.Observable.merge(...EventRecorder.mouseLocationEventObervables)
        //the mouse location observables are many - we currently only want the mouseover events
        .filter((event) => event.type == 'mouseover')
        //throttle but emit trailing value after time period
        .throttleTime(250, Rx.Scheduler.async, { leading: true, trailing: true })
        //then we want to add a quick xpath calculation to the event so we can work out if we have a unqiue element
        .map((event) => ({ event: event, xpath: xpathTimed(event.target) }))
        //then we only want to be taking elements that are unique as the css calculation can take a while, at least the CSS selector generator
        .distinctUntilChanged((prev, curr) => prev.xpath === curr.xpath)
        //then if we have a fresh element we want to map back to the event
        .map((eventObject) => eventObject.event)
        //log so we can see what's going on
        //.do(x => console.log( x.target.offsetTop, x.target.offsetLeft))
        //then we get the selectors for the pre-action event element, so it is not mutated
        .map((event) => {
            return {
                recordReplayEventTarget: event.target,
                eventCssSelectorPath: cssSelectorTimed(event.target),
                eventCssOptimalPath: optimalSelectTimed(event.target),
                eventRecordReplayPath: recordReplayTimed(event.target),
                eventXPath: xpathTimed(event.target),
                eventHref: window.location.href,
            };
        })
        //then it's very important that we share this one as three users currently and it is computationally costly
        .share();

    //then we also query the latest input location, which we collect by referring to the input events
    EventRecorder.InputLocator = Rx.Observable.merge(...EventRecorder.inputLocationEventObservables)
        //the input location observables are many - we currently only want the focus events
        .filter((event) => event.type == 'focus')
        .do((x) => console.log(x.target))
        //then log for useful debugging
        .filter((event) => EventRecorder.elementIsInput(event.target))
        .do((x) => console.log(x.target))
        //then we get the selectors for the pre-action event element, so it is not mutated
        .map((event) => {
            return {
                eventCssSelectorPath: EventRecorder.getCssSelectorPathWithFailover(event.target),
                eventCssOptimalPath: EventRecorder.getOptimalSelectPathWithFailover(event.target),
                eventRecordReplayPath: EventRecorder.getRecordReplayPathWithFailover(event.target),
                eventXPath: EventRecorder.getXPath(event.target),
                eventHref: window.location.href,
            };
        });

    //MOUSE ACTIONS
    //THERE IS SOME COMPLEXITY IN WORKING OUT WHAT IS A CLICK, WHAT IS A DOUBLE CLICK, WHAT IS A CONTEXTMENU CLICK AND WHAT IS A TEXT SELECT EVENT
    //WHEN THE MOUSE GOES DOWN IT CAN BE ANY OF THE FOUR
    EventRecorder.mouseActionObservable = Rx.Observable.merge(...EventRecorder.mouseActionEventObervables)
        //so we start with the mousedown event, which can generate any of our events
        .filter((event) => event.type == 'mousedown')
        //but we ignore mouse down events in HTMLInputElement, HTMLTextAreaElement and isContentEditable elements - we use the input change event for that
        .filter((event) => EventRecorder.elementIsInput(event.target) == false)
        //at the point of the mouse down event, we need to save the unadulterated last emission from the mouse locator
        .withLatestFrom(EventRecorder.MouseLocator)
        //then we need to make sure we don't get double clicks, as we are handling the double click event
        //this makes sure if we get a double click, we get the single mousedown emission which we then convert into the double click event
        .throttleTime(500, Rx.Scheduler.async, { leading: true, trailing: true })
        //otherwise we then need to start listening to see what happens after the mousedown event
        .switchMap(
            () =>
                Rx.Observable.combineLatest(
                    //we need the standard click and context menu events with a delay to allow the emission of the double click event
                    Rx.Observable.merge(...EventRecorder.mouseActionEventObervables)
                        .filter((event) => event.type == 'click' || event.type == 'contextmenu')
                        .delay(250),
                    //we need the double click events which may not happen, so we start with a default object
                    Rx.Observable.merge(...EventRecorder.mouseActionEventObervables)
                        .filter((event) => event.type == 'dblclick')
                        .startWith({ type: null }),
                    //we need the text selection events which may not happen, so
                    Rx.Observable.merge(...EventRecorder.attentionActionEventObservables)
                        //we are only interested in select start events
                        .filter((event) => event.type == 'selectstart')
                        //then wait and see if we get any selection appearing
                        .delay(500)
                        //we need to be able to distinguish between clicks and selectstart events, which we do by query the window selection half a second after
                        .filter(() => window.getSelection().toString().length > 0)
                        //we start with a default object
                        .startWith({ type: null })
                ),
            //then we need to process the events, with the unpacked mousedown and mouselocator events from withLatestFrom and the unpacked combineLatestArray
            //the first array contains 'live' events that are collected on mousedown and the second has 'delayed' and processed events
            ([mouseDownEvent, mouseLocatorEvent], [clickOrContextMenuEvent, doubleClickEvent, selectStartEvent]) => {
                //then we need to know if we have a valid select start event by timestamp and value
                const selectStartValid =
                    selectStartEvent.timeStamp > mouseDownEvent.timeStamp && selectStartEvent.type != null;
                //then we need to know if we have a valid double click event by timestamp and value
                const doubleClickValid =
                    doubleClickEvent.timeStamp > mouseDownEvent.timeStamp && doubleClickEvent.type != null;
                //then we need to know if we have a valid click or contextmenu event
                const clickValid = clickOrContextMenuEvent.timeStamp > mouseDownEvent.timeStamp;
                //then we need to return the event accordingly
                switch (true) {
                    //first we need to return a text select event if the text select event has fired and double click has not fired
                    case selectStartValid && !doubleClickValid:
                        //then we need to assign all the  location properties of the mouselocator event to the delayed selectstart event
                        //these are recordReplayEventTarget, eventCssSelectorPath, eventCssOptimalPath, eventRecordReplayPath, eventXPath
                        return Object.assign({}, mouseLocatorEvent, { type: selectStartEvent.type });
                    //then we need to return a double click event if both have fired - we do not handle double clicking as a method of text selection
                    case selectStartValid && doubleClickValid:
                        //ditto here
                        return Object.assign({}, mouseLocatorEvent, { type: doubleClickEvent.type });
                    //then we need to return a double click event if both the single click and double click have fired
                    case clickValid && doubleClickValid:
                        //ditto here
                        return Object.assign({}, mouseLocatorEvent, { type: doubleClickEvent.type });
                    //then we need to return the normal click event as the default
                    default:
                        return Object.assign({}, mouseLocatorEvent, { type: clickOrContextMenuEvent.type });
                }
            }
        )
        //reporting for debugging
        .do((event) => console.log(`RECORDING MOUSE EVENT: ${event.type.toUpperCase()}`))
        //and share amongst the text selection and mouse observables
        .share();

    //as we do not have a select end event, we have to construct one
    //and we need to name this as it is used to prevent double recordings of text selection and clicks
    EventRecorder.textSelectionObservable = EventRecorder.mouseActionObservable
        //the selection observables are many - we currently only want the select start event
        .filter((selectWithLocationEvent) => selectWithLocationEvent.type == 'selectstart')
        //then map the event to the Recording Event type
        .map((selectWithLocationEvent) => {
            //get the selection
            const selection = window.getSelection();
            //then return an object with properties that we need to filter and also to process a recording event
            return Object.assign({}, selectWithLocationEvent, { selectionString: selection.toString() });
        })
        //then filter for empty strings as that's an indication that the user either pressed on the contextMenu or changed their mind
        .filter((selectEndObject) => selectEndObject.selectionString.length > 0)
        //then process selectEndObject into a recording object
        .map((selectEndObject) => {
            //we need to do a bit of work on the text selection
            var selectionString;
            //the problem here comes on replays - you can have a partial text selection but it's no good saving that because the replay is looking for equality of ALL text
            //so we see if all the text has been selected
            if (selectEndObject.selectionString == selectEndObject.recordReplayEventTarget.textContent) {
                //if it has then the selection string can be saved as it is
                selectionString = selectEndObject.selectionString;
            } else {
                //if we have a partial text selection, we need to change it to the whole element text content, otherwise we will have replay fails
                selectionString = selectEndObject.recordReplayEventTarget.textContent.trim();
            }
            //then we just need to create the recording event
            const newEvent = new RecordingEvent({
                //general properties
                recordingEventAction: 'TextSelect',
                recordingEventActionType: selectEndObject.type,
                recordingEventHTMLElement: selectEndObject.recordReplayEventTarget.constructor.name,
                recordingEventHTMLTag: selectEndObject.recordReplayEventTarget.tagName,
                recordingEventCssSelectorPath: selectEndObject.eventCssSelectorPath,
                recordingEventCssDomPath: selectEndObject.eventCssOptimalPath,
                recordingEventCssFinderPath: selectEndObject.eventRecordReplayPath,
                recordingEventXPath: selectEndObject.eventXPath,
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: window.location.href,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                recordingEventIframeName: EventRecorder.contextIsIframe()
                    ? window.frameElement
                        ? window.frameElement.name
                        : null
                    : 'N/A',
                //information specific to text select events
                recordingEventTextSelectTextContent: selectionString,
                recordingEventTextSelectTargetAsJSON: EventRecorder.domToJSON(selectEndObject.recordReplayEventTarget),
            });
            return newEvent;
        });

    //MOUSE CLICK EVENTS
    EventRecorder.mouseObservable = EventRecorder.mouseActionObservable
        //as we have text selection events now in the mouse action observable, we need to filter them out
        .filter((event) => event.type != 'selectstart')
        //then map the event to the Recording Event type
        .map((actionWithLocationEvent) => {
            //create our event
            const newEvent = new RecordingEvent({
                recordingEventAction: 'Mouse',
                recordingEventActionType: actionWithLocationEvent.type,
                recordingEventHTMLElement: actionWithLocationEvent.recordReplayEventTarget.constructor.name,
                recordingEventHTMLTag: actionWithLocationEvent.recordReplayEventTarget.tagName,
                recordingEventCssSelectorPath: actionWithLocationEvent.eventCssSelectorPath,
                recordingEventCssDomPath: actionWithLocationEvent.eventCssOptimalPath,
                recordingEventCssFinderPath: actionWithLocationEvent.eventRecordReplayPath,
                recordingEventXPath: actionWithLocationEvent.eventXPath,
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: actionWithLocationEvent.eventHref,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                recordingEventIframeName: EventRecorder.contextIsIframe()
                    ? window.frameElement
                        ? window.frameElement.name
                        : null
                    : 'N/A',
            });
            //then return the event
            return newEvent;
        });

    //MOUSE HOVER EVENTS
    EventRecorder.mouseHoverObservable = EventRecorder.MouseLocator
        //Get the time of the mouseover event - this moves the mouselocator event to the value key of an object and adds a timestamp key as well with milliseconds
        .timestamp()
        //Don't emit until the mouseOut triggers
        .sample(
            Rx.Observable.merge(...EventRecorder.mouseLocationEventObervables).filter(
                (event) => event.type == 'mouseout'
            )
        )
        //Get a new timestamp (remember this is *after* mouse out) - this moves the mouselocator to a second level, referred by value so the mouselocator event is value.value.x
        .timestamp()
        //then allow through only those events that have a delay of more than 3000
        .filter(
            (timeStampedLayeredObject) =>
                timeStampedLayeredObject.timestamp - timeStampedLayeredObject.value.timestamp > 3000
        )
        //then map it to the MouseLocator event again
        .map((timeStampedLayeredObject) => timeStampedLayeredObject.value.value)
        //then create a recording event
        .map((mouseLocatorEvent) => {
            const newEvent = new RecordingEvent({
                //general properties
                recordingEventAction: 'Mouse',
                recordingEventActionType: 'hover',
                recordingEventHTMLElement: mouseLocatorEvent.recordReplayEventTarget.constructor.name,
                recordingEventHTMLTag: mouseLocatorEvent.recordReplayEventTarget.tagName,
                recordingEventCssSelectorPath: mouseLocatorEvent.eventCssSelectorPath,
                recordingEventCssDomPath: mouseLocatorEvent.eventCssOptimalPath,
                recordingEventCssFinderPath: mouseLocatorEvent.eventRecordReplayPath,
                recordingEventXPath: mouseLocatorEvent.eventXPath,
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: window.location.href,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                recordingEventIframeName: EventRecorder.contextIsIframe()
                    ? window.frameElement
                        ? window.frameElement.name
                        : null
                    : 'N/A',
                //information specific to text select events
                recordingEventHoverTargetAsJSON: EventRecorder.domToJSON(mouseLocatorEvent.recordReplayEventTarget),
            });
            return newEvent;
        });

    //MOUSE RECAPTCHA EVENTS
    EventRecorder.mouseRecaptchaObservable = Rx.Observable.merge(...EventRecorder.mouseActionEventObervables)
        //we only care about mousedown events here - the click event does not work for listening to recaptchas
        .filter((event) => event.type == 'mousedown')
        //then we only care about events in iframes as the recaptcha is served via the iframe
        .filter(() => EventRecorder.contextIsIframe())
        //then we only care about iframes served by google
        .filter(() => window.location.origin == 'https://www.google.com')
        //then we only care about recaptcha urls
        .filter(() => window.location.href.includes('recaptcha'))
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
                recordingEventIframeName: EventRecorder.contextIsIframe()
                    ? window.frameElement
                        ? window.frameElement.name
                        : null
                    : 'N/A',
            });
            return newEvent;
        });

    //INPUT EVENTS
    EventRecorder.inputObservable = Rx.Observable.merge(
        //we need to have the normal input observables
        Rx.Observable.merge(...EventRecorder.inputActionEventObservables),
        //but then we also need to pick up blur changes from the whole document for contenteditable elements, with true set so we can listen to event dispatch
        Rx.Observable.fromEvent(document, 'blur', true).filter((event) => event.target.isContentEditable)
    )
        //then as each action occurs, we want to know the state of the element BEFORE the action took place
        .withLatestFrom(EventRecorder.InputLocator)
        //then map the event to the Recording Event type
        .map(([actionEvent, locationEvent]) => {
            //we need to be sensitive to contenteditable events here, as the method of retrieving the value is different
            let inputType, inputValue;
            //handling different kinds of inputs
            switch (true) {
                //if the element is an input element or a text area element then we can just use the normal action type, input type and value
                case actionEvent.target instanceof HTMLInputElement ||
                    actionEvent.target instanceof HTMLTextAreaElement:
                    //we need to define the action type so we know what kind of input action
                    actionType = actionEvent.type;
                    //we need to know what kind of input type
                    inputType = actionEvent.target.type;
                    //then we need to know the value of the input
                    inputValue = actionEvent.target.value;
                    //and we're done
                    break;
                //if the element is a contentEditable element then we have to use set the special input type and use textContent
                case actionEvent.target.isContentEditable:
                    //add the special label for content editable actions
                    actionType = 'Content Edit';
                    //give the special label for contenteditable type so we can distinguish
                    inputType = 'contentEditable';
                    //then we go for the textcontent as the value of a contenteditable div, for example, is meaningless
                    //we trim the text here for presentation purposes - when we replay, in the InputReplay class, we also need to trim for asserting
                    inputValue = actionEvent.target.textContent.trim();
                    //and we're done
                    break;
                //then we have the default, which is used for HTMLSelectElement
                default:
                    //we need to define the action type so we know what kind of input action
                    actionType = actionEvent.type;
                    //we need to know what kind of input type
                    inputType = actionEvent.target.type;
                    //then we need to know the value of the input
                    inputValue = actionEvent.target.value;
                    //and we're done
                    break;
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
                recordingEventIframeName: EventRecorder.contextIsIframe()
                    ? window.frameElement
                        ? window.frameElement.name
                        : null
                    : 'N/A',
                //information specific to input events
                recordingEventInputType: inputType,
                recordingEventInputValue: inputValue,
            });
            return newEvent;
        });

    //KEYBOARD EVENTS
    EventRecorder.keyboardObservable = Rx.Observable.merge(...EventRecorder.keyBoardActionEventObservables)
        //then we only want the keyup event - we have chosen this as we want keyboard enter and tab events after any input events have registered, which happens on keydown
        .filter((event) => event.type == 'keyup')
        //then we want to make sure that we do not get the modifier keys - the state of these is collected as part of the keystroke
        .filter((event) => event.key != 'Shift' && event.key != 'Alt' && event.key != 'Control')
        //then we want to keep track of where the keydown event was pressed as the tab key, for example, can change location on the page
        //this works the same as using the mouse locator, it gives us the state of the page before keypress complete
        .withLatestFrom(
            Rx.Observable.merge(...EventRecorder.keyBoardActionEventObservables).filter(
                (event) => event.type == 'keydown'
            )
        )
        //then combine the two observables properties to create our RecordingEvent object
        .map(([actionEvent, keydownEvent]) => {
            //lets get some information about the key that has been pressed
            const keyInfoObject = EventRecorder.keyCodeDictionary[actionEvent.keyCode];
            const descriptor = keyInfoObject.descriptor;
            const newEvent = new RecordingEvent({
                //general properties
                recordingEventAction: 'Keyboard',
                recordingEventActionType: descriptor,
                recordingEventHTMLElement: keydownEvent.target.constructor.name,
                recordingEventHTMLTag: keydownEvent.target.tagName,
                recordingEventCssSelectorPath: EventRecorder.getCssSelectorPathWithFailover(keydownEvent.target),
                recordingEventCssDomPath: EventRecorder.getOptimalSelectPathWithFailover(keydownEvent.target),
                recordingEventCssFinderPath: EventRecorder.getRecordReplayPathWithFailover(keydownEvent.target),
                recordingEventXPath: EventRecorder.getXPath(keydownEvent.target),
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: window.location.href,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                recordingEventIframeName: EventRecorder.contextIsIframe()
                    ? window.frameElement
                        ? window.frameElement.name
                        : null
                    : 'N/A',
                //information specific to keyboard events
                recordingEventKey: actionEvent.key,
                recordingEventCode: actionEvent.code,
                recordingEventKeyCode: actionEvent.keyCode,
                recordingEventDispatchKeyEvent: EventRecorder.keyCodeDictionary.generateDispatchKeyEvent(actionEvent),
            });
            return newEvent;
        })
        //then a simple filter to ensure that the keyboard events on input element do not make it through to the final output
        .filter((object) => object != false);

    //SCROLL EVENTS
    EventRecorder.scrollObservable = Rx.Observable.merge(...EventRecorder.scrollActionEventObservables)
        //then we are interested only in scroll events
        .filter((event) => event.type == 'scroll')
        //then for the time being we only want to record scroll events on the document element
        .filter((event) => event.target instanceof HTMLDocument)
        //then we only want to get the last event after scrolling has stopped for 1/2 second - longer and the scroll events can occur after the click that should follow
        .debounceTime(500)
        //then we need to translate that event into something that can be repeated so we need the x and y co-ordinates and the given scrolling element
        .map((actionEvent) => {
            const newEvent = new RecordingEvent({
                //general properties
                recordingEventAction: 'Scroll',
                recordingEventActionType: `x: ${Math.round(
                    actionEvent.target.scrollingElement.scrollLeft
                )}, y: ${Math.round(actionEvent.target.scrollingElement.scrollTop)}`,
                recordingEventHTMLElement: actionEvent.target.constructor.name,
                recordingEventHTMLTag: actionEvent.target.scrollingElement.tagName,
                recordingEventCssSelectorPath: EventRecorder.getCssSelectorPathWithFailover(
                    actionEvent.target.scrollingElement
                ),
                recordingEventCssDomPath: EventRecorder.getOptimalSelectPathWithFailover(
                    actionEvent.target.scrollingElement
                ),
                recordingEventCssFinderPath: EventRecorder.getRecordReplayPathWithFailover(
                    actionEvent.target.scrollingElement
                ),
                recordingEventXPath: EventRecorder.getXPath(actionEvent.target.scrollingElement),
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: window.location.href,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                recordingEventIframeName: EventRecorder.contextIsIframe()
                    ? window.frameElement
                        ? window.frameElement.name
                        : null
                    : 'N/A',
                //information specific to scroll events
                recordingEventXPosition: Math.round(actionEvent.target.scrollingElement.scrollLeft),
                recordingEventYPosition: Math.round(actionEvent.target.scrollingElement.scrollTop),
            });
            return newEvent;
        });

    //SCROLL ITEM EVENTS
    EventRecorder.scrollItemObservable = Rx.Observable.merge(...EventRecorder.scrollActionEventObservables)
        //then we are interested only in scroll events
        .filter((event) => event.type == 'scroll')
        //then we are only listening for scroll events on individual elements, not the html document which is handled elsewhere
        .filter((event) => event.target instanceof HTMLDocument == false)
        //then we only want to get the last event after scrolling has stopped for 1/2 second - longer and the scroll events can occur after the click that should follow
        .debounceTime(500)
        //then we need to translate that event into something that can be repeated so we need the x and y co-ordinates and the given scrolling element
        .map((actionEvent) => {
            const newEvent = new RecordingEvent({
                //general properties
                recordingEventAction: 'ElementScroll',
                recordingEventActionType: `x: ${Math.round(actionEvent.target.scrollLeft)}, y: ${Math.round(
                    actionEvent.target.scrollTop
                )}`,
                recordingEventHTMLElement: actionEvent.target.constructor.name,
                recordingEventHTMLTag: actionEvent.target.tagName,
                recordingEventCssSelectorPath: EventRecorder.getCssSelectorPathWithFailover(actionEvent.target),
                recordingEventCssDomPath: EventRecorder.getOptimalSelectPathWithFailover(actionEvent.target),
                recordingEventCssFinderPath: EventRecorder.getRecordReplayPathWithFailover(actionEvent.target),
                recordingEventXPath: EventRecorder.getXPath(actionEvent.target),
                recordingEventLocation: window.location.origin,
                recordingEventLocationHref: window.location.href,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                recordingEventIframeName: EventRecorder.contextIsIframe()
                    ? window.frameElement
                        ? window.frameElement.name
                        : null
                    : 'N/A',
                //information specific to scroll events
                recordingEventXPosition: Math.round(actionEvent.target.scrollLeft),
                recordingEventYPosition: Math.round(actionEvent.target.scrollTop),
            });
            return newEvent;
        });

    //FILE DROP EVENTS
    EventRecorder.fileDropObservable = Rx.Observable.merge(...EventRecorder.fileDropActionEventObservables)
        //then we are interested only in drop events
        .filter((event) => event.type == 'drop')
        //then we are interested only in drop events that contain files
        .filter((event) => event.dataTransfer.files.length > 0)
        //then as each action occurs, we want to know the state of the element BEFORE the action took place
        .withLatestFrom(EventRecorder.MouseLocator)
        //then map the event to the Recording Event type
        .flatMap(([dropEvent, locationEvent]) => {
            //save a reference to the file, which is just a wrapper for the blob prototype so it has the blob methods
            const file = dropEvent.dataTransfer.files[0];
            //return an async function that gives us a chance to get the data from the file
            return (async () => {
                //first we define a variable to hold the data
                let data;
                //then we need to check to see if the data is binary or not, for the time being we need to do a mime type check
                ['image', 'video', 'audio', 'pdf', 'octet-stream'].some((item) => file.type.includes(item))
                    ? (data = await file.arrayBuffer())
                    : (data = await file.text());
                //then we construct the blob
                const blob = new Blob([data], { type: file.type });
                //then we create the recording event
                const newEvent = new RecordingEvent({
                    //general properties
                    recordingEventAction: 'FileDrop',
                    recordingEventActionType: file.type,
                    recordingEventHTMLElement: locationEvent.recordReplayEventTarget.constructor.name,
                    recordingEventHTMLTag: locationEvent.recordReplayEventTarget.tagName,
                    recordingEventCssSelectorPath: EventRecorder.getCssSelectorPathWithFailover(
                        locationEvent.recordReplayEventTarget
                    ),
                    recordingEventCssDomPath: EventRecorder.getOptimalSelectPathWithFailover(
                        locationEvent.recordReplayEventTarget
                    ),
                    recordingEventCssFinderPath: EventRecorder.getRecordReplayPathWithFailover(
                        locationEvent.recordReplayEventTarget
                    ),
                    recordingEventXPath: EventRecorder.getXPath(locationEvent.recordReplayEventTarget),
                    recordingEventLocation: window.location.origin,
                    recordingEventLocationHref: window.location.href,
                    recordingEventIsIframe: EventRecorder.contextIsIframe(),
                    recordingEventIframeName: EventRecorder.contextIsIframe()
                        ? window.frameElement
                            ? window.frameElement.name
                            : null
                        : 'N/A',
                    //information specific to file drop events events
                    recordingEventFileBlob: blob,
                    recordingEventFileType: file.type,
                });
                return newEvent;
            })();
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
        //handles all file drop events - not yet ready to ship as simulating drop events not yet done
        //EventRecorder.fileDropObservable
    )
        //and log the output
        .subscribe((recordingEvent) => {
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
};

//START FUNCTION
//WE ONLY WANT TO START IN IFRAME OR CONTENT SCRIPT CONTEXT
//IF THIS IS INJECTED INTO MAIN FRAME BY DEBUGGER, WE WILL HAVE DOUBLE REPORTING
switch (true) {
    //if we are an iframe we need to report and start
    case EventRecorder.contextIsIframe():
        console.log(
            `%cEvent Recorder activated via Content Script in iframe with origin ${window.location.origin}`,
            'color: green'
        );
        EventRecorder.startRecordingEvents();
        break;
    case EventRecorder.contextIsContentScript():
        console.log(
            `%cEvent Recorder activated via Content Script in main frame with origin ${window.location.origin}`,
            'color: blue'
        );
        EventRecorder.startRecordingEvents();
        break;
    default:
        console.log(
            `%cEvent Recorder NOT activated in main frame with origin ${window.location.origin}`,
            'color: dimgrey'
        );
}
