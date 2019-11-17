//The onsearch event occurs when a user presses the "ENTER" key or clicks the "x" button in an <input> element with type="search"
//The oninput event occurs when an element gets user input - similar to the onchange event. The difference is that the oninput event 
//occurs immediately after the value of an element has changed, while onchange occurs when the element loses focus, after the content has been changed. 
//The oninvalid event occurs when a submittable <input> element is invalid.
const inputEvents = ["onsearch", "onchange", "oninput", "oninvalid"];

//The onchange event occurs when a user changes the selected option of a <select> element
const selectEvents = ["onchange"];

//blur and focus events
//The onscroll event occurs when an element's scrollbar is being scrolled.
//The onselect event occurs after some text has been selected in an element.
//The selectstart event fires when the user starts to make a new text selection on a webpage.
//The selectionchange event fires when the text selected on a webpage changes
const attentionEvents = ["onblur", "onfocus", "onscroll", "onselect", "onselectstart", "selectionchange"];

//The cancel event fires when the user indicates a wish to dismiss a <dialog>
//The close event fires when the user closes a <dialog>.
const dialogEvents = ["oncancel", "onclose"];

//The contextmenu event typically fires when the right mouse button is clicked on the window
//The onsubmit event occurs when a form is submitted.
//The ontoggle event occurs when the user opens or closes the <details> element.
//The onwheel event occurs when the mouse wheel is rolled up or down over an element.
//The auxclick event is raised when a non-primary button has been pressed on an input device (e.g., a middle mouse button).
const mouseEvents = [
    "onclick", "oncontextmenu", "ondblclick", 
    "onmousedown", "onmouseenter", "onmouseleave", 
    "onmousemove", "onmouseout", "onmouseover", 
    "onmouseup", "onmousewheel", "onpointerdown",
    "onpointermove", "onpointerup", "onpointercancel",
    "onpointerover", "onpointerout", "onpointerenter",
    "onpointerleave", "onpointerrawupdate", "onsubmit",
    "ontoggle", "onwheel", "onauxclick", "ondrag", 
    "ondragend", "ondragenter", "ondragleave", 
    "ondragover", "ondragstart", "ondrop"
];

const keyboardEvents = ["onkeydown", "onkeypress", "onkeyup"];

//The onpagehide event is sometimes used instead of the onunload event, as the onunload event causes the page to not be cached.
//The onpageshow event is similar to the onload event, except that it occurs after the onload event when the page first loads. 
//Also, the onpageshow event occurs every time the page is loaded, whereas the onload event does not occur when the page is loaded from the cache.
const browserWindowEvents = ["onresize", "onpagehide", "onpageshow"];

//when subscribing to events, collect all events under a single subscribe loop into an object, then emit the object each time
//then add an event property to object with outerhtml event.target.outerHTML, as well as event.target.offsetTop and event.target.offsetLeft, then add the details of the event
//can add the css and xpath identifiers later, after blur event



//UTILITY FUNCTIONS

//use position on the screen and outerHTML to provide a unique identifier for each event target
const quickUniqueID = element => { return `offsetTop:${element.offsetTop}|offsetLeft:${element.offsetLeft}|outerHTML:${element.outerHTML}`; }

