class DomSelectorReport {

    constructor(options) {

        //the use of the anonymous async function in constructor enables us to set up the tab runner with any callback functions and receive responses
        //see https://stackoverflow.com/questions/43431550/async-await-class-constructor

        return (async () => {

            //we need to create a uniform class with the given selector, using inputs that we get from the EventRecorder
            //we need to have the key so we can report
            this.selectorKey = options.key;
            //we need to have the browser tab id for the commands
            this.browserTabId = options.browserTabId;
            //we need to have the target tag
            this.targetHtmlElement = options.replayEvent.recordingEventHTMLElement;
            //then we need to get the correct selector
            switch(this.selectorKey) {
                case "CssSelector":
                    this.selectorString = options.replayEvent.recordingEventCssSelectorPath;
                    break;
                case "DomPathSelector":
                    this.selectorString = options.replayEvent.recordingEventCssDomPath;
                    break;
                case "FinderSelector":
                    this.selectorString = options.replayEvent.recordingEventCssFinderPath;
                    break;
            }
            //then we need to know if we are operating in an iframe or not 
            this.isIframe = options.replayEvent.recordingEventIsIframe;
            //then we need to remember successful iframe searches frame id
            this.successFrameId = null;
            //then the class needs to provide log messages
            this.logMessages = [];
            //then the class needs to provide warning messages
            this.warningMessages = [];
            //this is the standard query selector - we cannot serialize the dom node itself so we get shorthand constructor name
            //we can test for constructor name
            this.executeQuerySelector = () => {
                return new Promise(resolve => 
                    chrome.tabs.executeScript(this.browserTabId, 
                        //If true and frameId is set, then the code is inserted in the selected frame and all of its child frames.
                        { code: `document.querySelector('${this.selectorString}').constructor.name;`, runAt: "document_idle" },
                        //log the script injection so we can see what's happening and resolve the promise  
                        (array) => { 
                            //console.log(`Executed Query Selector in Main Document`); 
                            resolve(array[0]); 
                        } 
                    )
                )
            }
            //this is the standard query selector all - we cannot serialize the nodelist of dom nodes itself so we get shorthand length
            //we can test for constructor name
            this.executeQuerySelectorAll = () => {
                return new Promise(resolve => 
                    chrome.tabs.executeScript(this.browserTabId, 
                        //If true and frameId is set, then the code is inserted in the selected frame and all of its child frames.
                        { code: `document.querySelectorAll('${this.selectorString}').length;`, runAt: "document_idle" },
                        //log the script injection so we can see what's happening and resolve the promise  
                        (array) => { 
                            //console.log(`Executed Query Selector in Main Document`); 
                            resolve(array[0]); 
                        } 
                    )
                )
            }
            //then we need to have a promise that executes the query selector for iframes - we cannot serialize the dom node itself so we get shorthand constructor name
            this.executeIframeQuerySelector = (navObject) => {
                return new Promise(resolve => 
                    chrome.tabs.executeScript(this.browserTabId, 
                        //If true and frameId is set, then the code is inserted in the selected frame and all of its child frames.
                        { code: `document.querySelector('${this.selectorString}').constructor.name;`, frameId: navObject.frameId, runAt: "document_idle" },
                        //log the script injection so we can see what's happening and resolve the promise  
                        (array) => { 
                            //console.log(`Executed Query Selector in Iframe: ${navObject.url}`); 
                            resolve({element: array[0], frameId: navObject.frameId}); 
                        } 
                    )
                )
            }
            
            if (!this.isIframe) {

                //this delivers the constructor name if we find something - null if not
                this.selectedItem = await this.executeQuerySelector();
                //report the constructor name
                console.log(this.selectedItem);

                if (this.selectedItem == null) {
                    //so we need to report an invalid selector and return the object
                    this.invalidSelector = true;
                    //then give some feedback
                    this.warningMessages.push(`${this.selectorKey} Selector Returned Null`);
                    //this is an early exit as there's nothing more to do
                    return this;
                }
                //if the item is not the same html element we need to return, unless we are dealing with the HTML document, as CSS selectors return constructor name as HTMLHtmlElement
                if (this.targetHtmlElement != "HTMLDocument" && this.selectedItem != this.targetHtmlElement) {
                    //so the CSS selector has found an element but it does not match by constrcutor name
                    this.invalidSelector = true;
                    //then give some feedback
                    this.warningMessages.push(`${this.selectorKey} Unmatched Constructor Name ${this.selectedItem.constructor.name}`);
                    //this is an early exit as there's nothing more to do
                    return this;
                }
        
                //then we need to warn on multiple matches, as we can start to have problems with targeting
                this.selectedItemLength = await this.executeQuerySelectorAll();
                //we cannot afford to use a selector that generates multiple matches
                if (this.selectedItemLength > 1) {
                    //so the CSS selector has found too many elements
                    this.invalidSelector = true;
                    //then give some feedback
                    this.warningMessages.push(`${this.selectorKey} Multiple Selector Matches`);
                    //this is an early exit as there's nothing more to do
                    return this;
                }
                
                //then we report good finish
                this.logMessages.push(`${this.selectorKey} Found in Document`);
                //and we're done - always remember to return this to the constructor in an async function or the whole thing is pointless
                return this; 

            } else {

                //so for iframes we need to work with the iframeContextArray that we created in the replay tab runner
                //this is created in the replay tab runner and has objects with {frameId: <string> and url: <string>}
                const iframeQuerySelectorExecutionArray = options.replayEvent.iframeContextArray
                    //then we need to map each navobject to the promise that uses chrome.tabs execute script to get results 
                    .map(navObject => this.executeIframeQuerySelector(navObject));

                //so we then run all the promises at the same time
                const resultArray = await Promise.all(iframeQuerySelectorExecutionArray);

                //then we need to see if we have anything other than null values as the object element property
                var outputArray = resultArray.filter(object => object.element);
                //then if we have an empty array we return zip
                if (outputArray.length == 0) {
                    //so we need to report an invalid selector and return the object
                    this.invalidSelector = true;
                    //then give some feedback
                    this.warningMessages.push(`${this.selectorKey} Selector Not Found in Iframe`);
                    //this is an early exit as there's nothing more to do
                    return this;
                } else {
                    //get the first match
                    this.selectedItem = outputArray[0].element;
                    //save the frame id so we can use that for focus
                    this.successFrameId = outputArray[0].frameId;
                    //report the constructor name
                    console.log(this.selectedItem);
                    //if the item is not the same html element we need to return, unless we are dealing with the HTML document, as CSS selectors return constructor name as HTMLHtmlElement
                    if (this.targetHtmlElement != "HTMLDocument" && this.selectedItem != this.targetHtmlElement) {
                        //so the CSS selector has found an element but it does not match by constrcutor name
                        this.invalidSelector = true;
                        //then give some feedback
                        this.warningMessages.push(`${this.selectorKey} Unmatched Constructor Name ${this.selectedItem.constructor.name}`);
                        //this is an early exit as there's nothing more to do
                        return this;
                    }
                    //then we report good finish
                    this.logMessages.push(`${this.selectorKey} Found in Iframe`);
                    //and we're done - always remember to return this to the constructor in an async function or the whole thing is pointless
                    return this; 
                }          

            }

        })();

    }

}