//A LIST OF ALL WINDOW EVENTS FOR TOTAL USER INTERACTION COVERAGE

//The onsearch event occurs when a user presses the "ENTER" key or clicks the "x" button in an <input> element with type="search"
//The oninput event occurs when an element gets user input - similar to the onchange event. The difference is that the oninput event 
//occurs immediately after the value of an element has changed, while onchange occurs when the element loses focus, after the content has been changed. 
//The oninvalid event occurs when a submittable <input> element is invalid.
const inputEvents = ["search", "change", "input", "invalid"];

//The onchange event occurs when a user changes the selected option of a <select> element
const selectEvents = ["change"];

//blur and focus events
//The onscroll event occurs when an element's scrollbar is being scrolled.
//The onselect event occurs after some text has been selected in an element.
//The selectstart event fires when the user starts to make a new text selection on a webpage.
//The selectionchange event fires when the text selected on a webpage changes
const attentionEvents = ["blur", "focus", "scroll", "select", "selectstart", "selectionchange"];

//The cancel event fires when the user indicates a wish to dismiss a <dialog>
//The close event fires when the user closes a <dialog>.
const dialogEvents = ["cancel", "close"];

//The contextmenu event typically fires when the right mouse button is clicked on the window
//The onsubmit event occurs when a form is submitted.
//The ontoggle event occurs when the user opens or closes the <details> element.
//The onwheel event occurs when the mouse wheel is rolled up or down over an element.
//The auxclick event is raised when a non-primary button has been pressed on an input device (e.g., a middle mouse button).
const mouseLocationEvents = [
    "mouseenter", "mouseleave", "mousemove", 
    "mouseout", "mouseover", "pointermove", 
    "pointerover", "pointerout", "pointerenter",
    "pointerleave", "pointercancel", "pointerrawupdate"
];

const mouseActionEvents = [
    "click", "contextmenu", "dblclick", 
    "mousedown", "mouseup", "mousewheel", 
    "pointerdown", "pointerup", "submit",
    "toggle", "wheel", "auxclick", "drag", 
    "dragend", "dragenter", "dragleave", 
    "dragover", "dragstart", "drop"
];

const keyboardEvents = ["keydown", "keypress", "keyup"];

//The onpagehide event is sometimes used instead of the onunload event, as the onunload event causes the page to not be cached.
//The onpageshow event is similar to the onload event, except that it occurs after the onload event when the page first loads. 
//Also, the onpageshow event occurs every time the page is loaded, whereas the onload event does not occur when the page is loaded from the cache.
const browserWindowEvents = ["resize", "pagehide", "pageshow"];

//when subscribing to events, collect all events under a single subscribe loop into an object, then emit the object each time
//then add an event property to object with outerhtml event.target.outerHTML, as well as event.target.offsetTop and event.target.offsetLeft, then add the details of the event
//can add the css and xpath identifiers later, after blur event


var EventRecorder = {
    //SELECT MOUSE EVENTS FOR CONVERSION TO OBSERVABLES
    //we want to record location events so we know the state of any element BEFORE action occurs
    mouseLocationEventObervables: mouseLocationEvents.filter(item => item == "mouseover")
        //we map each string array item to an observable
        .map(eventName => Rx.Observable.fromEvent(window, eventName)),
    //we want to record action events so we know when user action occurs
    mouseActionEventObervables: mouseActionEvents
        //then we are interested in only certain types of mouse events
        .filter(item => item == "click" || item == "contextmenu" || item == "dblclick")
        //we map each string array item to an observable
        .map(eventName => Rx.Observable.fromEvent(window, eventName)),

    //SELECT INPUT EVENTS FOR CONVERSION TO OBSERVABLEs
    inputLocationEventObservables: inputEvents
        //then we are only interests in certain types of input events
        .filter(item => item == "input")
        //we map each string array item to an observable
        .map(eventName => Rx.Observable.fromEvent(window, eventName)),
    inputActionEventObservables: inputEvents
        //then we are only interests in certain types of input events
        .filter(item => item == "change")
        //we map each string array item to an observable
        .map(eventName => Rx.Observable.fromEvent(window, eventName)),
    
    //SELECT TEXT SELECT EVENTS FOR CONVERSION TO OBSERVABLEs
    selectStartActionEventObservable: attentionEvents
        //then we are interested in only certain types of mouse events
        .filter(item => item == "selectstart")
        //we map each string array item to an observable
        .map(eventName => Rx.Observable.fromEvent(document, eventName)),

    //we need to have instance of CSS selector generator class instantiated at the time of creation
    cssSelectorClass: new CssSelectorGenerator,
    //then we need a function that returned the CSS selector path
    getCssSelectorPath: element => EventRecorder.cssSelectorClass.getSelector(element),
    //then we get a function that returns the Dompath CSS selector
    getCssDomPath: element => { const path = new dompath(element); return path.toCSS(); },
    //then a function that returns the Simmer Css selector
    getCssSimmerPath: element => window.Simmer(element),
    //then a function that returns xpath of element
    getXPath: element => {
        var allNodes = document.getElementsByTagName('*'); 
        for (var segs = []; element && element.nodeType == 1; element = element.parentNode) {
             if (element.hasAttribute('id')) {
                var uniqueIdCount = 0;
                for (var n=0; n < allNodes.length; n++) {
                    if (allNodes[n].hasAttribute('id') && allNodes[n].id == element.id) uniqueIdCount++;
                    if (uniqueIdCount > 1) break;
                }
                if ( uniqueIdCount == 1) {
                    segs.unshift("//*[@id='" + element.getAttribute('id') + "']");
                    return segs.join('/');
                } else {
                    segs.unshift(element.localName.toLowerCase() + '[@id="' + element.getAttribute('id') + '"]');
                }
            } else {
                for (var i = 1, sib = element.previousSibling; sib; sib = sib.previousSibling) {
                    if (sib.localName == element.localName)  i++; 
                }
                segs.unshift(element.localName.toLowerCase() + '[' + i + ']');
            }
         }
         return segs.length ? '/' + segs.join('/') : null;
     },
     domToJSON: node => {
        
        node = node || this;
            
        var obj = { nodeType: node.nodeType};

        if (node.tagName) { obj.tagName = node.tagName.toLowerCase(); } 
        else if (node.nodeName) { obj.nodeName = node.nodeName; }
            
        if (node.nodeValue) { obj.nodeValue = node.nodeValue; }
            
        var attrs = node.attributes;
            
        if (attrs) {
            var length = attrs.length;
            var arr = obj.attributes = new Array(length);
              
            for (var i = 0; i < length; i++) {
                attr = attrs[i];
                arr[i] = [attr.nodeName, attr.nodeValue];
            }
        }
            
        var childNodes = node.childNodes;
            
        if (childNodes) {
              
            length = childNodes.length;
            arr = obj.childNodes = new Array(length);
              
            for (i = 0; i < length; i++) {
                
                arr[i] = EventRecorder.domToJSON(childNodes[i]);
              
            }
            
        }
            
        return obj;
          
    }
    
}

EventRecorder.startRecordingEvents = () => {

    //ALL OF OUR SEPARATE EVENTS REQUIRE AN UNADULTERATED LOCATOR that generates css selectors BEFORE ACTION
    
    //so we query the latest mouse location, which we collect by referring to the mouseover events
    const MouseLocator = Rx.Observable.merge(...EventRecorder.mouseLocationEventObervables)
        //the mouse location observables are many - we currently only want the mouseover events
        .filter(event => event.type == "mouseover")
        //then we only want to have the new event when a new element is first entered, no multiple iterations as that can catch mutations following click
        .distinctUntilChanged((previousEvent, currentEvent) => 
            //here we get unique elements according to their position on the screen
            (previousEvent.target.offsetTop == currentEvent.target.offsetTop) && (previousEvent.target.offsetLeft == currentEvent.target.offsetLeft)
        )
        //then log for useful debugging
        //.do(x => console.log(x))
        //then we get the selectors for the pre-action event element, so it is not mutated
        .map(event => {
            return {
                eventTarget: event.target,
                eventCssSelectorPath: EventRecorder.getCssSelectorPath(event.target),
                eventCssDomPath: EventRecorder.getCssDomPath(event.target),
                eventCssSimmerPath: EventRecorder.getCssSimmerPath(event.target),
                eventXPath: EventRecorder.getXPath(event.target)
            }
        });

    //then we also query the latest input location, which we collect by referrring to the input events
    const InputLocator = Rx.Observable.merge(...EventRecorder.inputLocationEventObservables)
        //the input location observables are many - we currently only want the input events
        .filter(event => event.type == "input")
        //then log for useful debugging
        //.do(x => console.log(x))
        //then we get the selectors for the pre-action event element, so it is not mutated
        .map(event => {
            return {
                eventCssSelectorPath: EventRecorder.getCssSelectorPath(event.target),
                eventCssDomPath: EventRecorder.getCssDomPath(event.target),
                eventCssSimmerPath: EventRecorder.getCssSimmerPath(event.target),
                eventXPath: EventRecorder.getXPath(event.target)
            }
        });

    //MOUSE EVENTS
    Rx.Observable.merge(...EventRecorder.mouseActionEventObervables)
        //then we only want mouse events to activate on non-input elements because we have a separate handler for them
        .filter(event => event.target instanceof HTMLInputElement == false)
        //then as each action occurs, we want to know the state of the element BEFORE the action took place
        .withLatestFrom(MouseLocator)
        //then map the event to the Recording Event type
        .map(([actionEvent, locationEvent])=> {
            const newEvent = new RecordingEvent({
                recordingEventAction: 'Mouse',
                recordingEventHTMLElement: actionEvent.target.constructor.name,
                recordingEventHTMLTag: actionEvent.target.tagName,
                recordingEventCssSelectorPath: locationEvent.eventCssSelectorPath,
                recordingEventCssDomPath: locationEvent.eventCssDomPath,
                recordingEventCssSimmerPath: locationEvent.eventCssSimmerPath,
                recordingEventXPath: locationEvent.eventXPath,
                recordingEventLocation: window.location.origin,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
            });
            return newEvent;
        })
        .subscribe(recordingEvent => console.log(recordingEvent));
    
    //INPUT EVENTS
    Rx.Observable.merge(...EventRecorder.inputActionEventObservables)
        //then as each action occurs, we want to know the state of the element BEFORE the action took place
        .withLatestFrom(InputLocator)
        //then map the event to the Recording Event type
        .map(([actionEvent, locationEvent])=> {
            const newEvent = new RecordingEvent({
                //general properties
                recordingEventAction: 'Input',
                recordingEventHTMLElement: actionEvent.target.constructor.name,
                recordingEventHTMLTag: actionEvent.target.tagName,
                recordingEventCssSelectorPath: locationEvent.eventCssSelectorPath,
                recordingEventCssDomPath: locationEvent.eventCssDomPath,
                recordingEventCssSimmerPath: locationEvent.eventCssSimmerPath,
                recordingEventXPath: locationEvent.eventXPath,
                recordingEventLocation: window.location.origin,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                //information specific to input events
                recordingEventInputType: actionEvent.type,
                recordingEventInputValue: actionEvent.target.type
            });
            return newEvent;
        })
        .subscribe(recordingEvent => console.log(recordingEvent));

    //TEXT SELECT EVENTS
    Rx.Observable.merge(...EventRecorder.selectStartActionEventObservable)
        //then as each action occurs, we want to know the state of the element BEFORE the action took place
        .withLatestFrom(MouseLocator)
        //then map the event to the Recording Event type
        .map(([_, mouseEvent])=> {
            const newEvent = new RecordingEvent({
                //general properties
                recordingEventAction: 'TextSelect',
                recordingEventHTMLElement: mouseEvent.eventTarget.constructor.name,
                recordingEventHTMLTag: mouseEvent.eventTarget.tagName,
                recordingEventCssSelectorPath: mouseEvent.eventCssSelectorPath,
                recordingEventCssDomPath: mouseEvent.eventCssDomPath,
                recordingEventCssSimmerPath: mouseEvent.eventCssSimmerPath,
                recordingEventXPath: mouseEvent.eventXPath,
                recordingEventLocation: window.location.origin,
                recordingEventIsIframe: EventRecorder.contextIsIframe(),
                //information specific to text select events
                recordingEventTextSelectTargetAsJSON: EventRecorder.domToJSON(mouseEvent.eventTarget)
            });
            return newEvent;
        })
        .subscribe(recordingEvent => console.log(recordingEvent));


}




//send message according to the enviroment
EventRecorder.sendEvent = recordingEvent => {
    //if we are in an iframe rather than the content script environment, then this will return true
    if (typeof chrome.runtime.getManifest == 'undefined' && EventRecorder.contextIsIframe()) {
        //then we need to send a special kind of message, which uses window.postMessage and is relayed by content script, remember wildcard so anyone can hear it
        window.parent.postMessage(recordingEvent, "*");
    } else {
        //just the standard message passing from extension
        chrome.runtime.sendMessage(recordingEvent, function(response) {
            console.log(response);
        });
    }
}

//UTILITY FUNCTIONS

EventRecorder.contextIsIframe = () => { 
    try { return window.self !== window.top; } 
    catch (e) { return true; } 
}
    
//use position on the screen and outerHTML to provide a unique identifier for each event target
EventRecorder.quickUniqueID = element => { return `offsetTop:${element.offsetTop}|offsetLeft:${element.offsetLeft}|outerHTML:${element.outerHTML}`; }

//START FUNCTION
//WE ONLY WANT TO START IN IFRAME OR CONTENT SCRIPT CONTEXT
//IF THIS IS INJECTED INTO MAIN FRAME BY DEBUGGER, WE WILL HAVE DOUBLE REPORTING
switch(true) {
    //if we are an iframe we need to report and start
    case EventRecorder.contextIsIframe():
        console.log(`%cEvent Recorder activated in iframe with origin ${window.origin}`, 'color: green');
        EventRecorder.startRecordingEvents();
        break;
    case typeof chrome.runtime.getManifest != 'undefined':
        console.log(`%cEvent Recorder activated in main frame with origin ${window.origin}`, 'color: blue');
        EventRecorder.startRecordingEvents();
        break;
    default:
        console.log(`%cEvent Recorder NOT activated in main frame with origin ${window.origin}`, 'color: dimgrey');
}

