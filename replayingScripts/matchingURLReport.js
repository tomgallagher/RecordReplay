//THIS PERFORMS A COMPLICATED OPERATION
//THIS SCRIPT RUNS IN EVERY SINGLE EXECUTION CONTEXT AND IT IS UP TO THIS LOGIC TO MAKE SURE IT ONLY RUNS REPLAY EVENTS THAT BELONG TO THIS CONTEXT

class MatchingUrlReport {

    constructor(replayEvent) {

        //we need to work out if the incoming message is intended for this content script - this can be complex with iframes which change their search params
        this.contentScriptUrl = new URL(window.location.href);
        this.eventTargetUrl = new URL(replayEvent.recordingEventLocationHref);
        //we start with the assumption that the urls are not going to match
        this.matched = false;
        //then we need to take some decisions based on the comparison between the two urls
        switch(true){
            //this differentiates host pages from third party iframes
            case this.contentScriptUrl.origin != this.eventTargetUrl.origin:
                //no match so we just log this for debugging and then break
                EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Origin`);
                break;
            //this differentiates host pages from same domain iframes
            case this.contentScriptUrl.pathname != this.eventTargetUrl.pathname:
                //no match so we just log this for debugging and then break
                EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Path`);
                break;
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
                    EventReplayer.logWithContext(`Matched Location On Search Params Key Equivalence: Executing ${replayEvent.assertionId || replayEvent.replayEventId}`);
                    this.matched = true;
                } else {
                    //otherwise we need to report 
                    EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} from Unmatched Search Params`);
                }
                break;
            //when we have no fails on the url we are left with three options:
            //it is the main frame with a perfect matching url
            //it is a vanilla iframe with a perfect matching url - there can be many of these in the same page
            //it is a cross-domain iframe with a perfect matching url
            default:
                //so we need to have a further level of nested logic here
                switch(true){
                    //IF WE ARE IN THE MAIN FRAME AND THE EVENT WAS IN THE MAIN FRAME THEN WE WANT TO REPORT A MATCH - WE'RE DONE
                    case !EventReplayer.contextIsIframe() && !replayEvent.recordingEventIsIframe:
                        EventReplayer.logWithContext(`Matched Main Frame Location Href: Executing ${replayEvent.assertionId || replayEvent.replayEventId}`);
                        this.matched = true;
                        break;
                    //IF WE ARE IN AN IFRAME AND THE EVENT WAS IN AN IFRAME WE NEED TO DO SOME MORE WORK TO DISTINGUISH BETWEEN CROSS-DOMAIN AND VANILLA IFRAMES
                    //THE PROBLEM IS THAT BOTH WILL HAVE A PERFECT MATCHING URL 
                    case EventReplayer.contextIsIframe() && replayEvent.recordingEventIsIframe:
                        //WE CAN OPERATE FROM THE BASIS THAT A VANILLA IFRAME HAS A NON-NULL VALUE FOR window.frameElement, as we do in the recording
                        if (window.frameElement && window.frameElement.name == replayEvent.recordingEventIframeName) {
                            //then we can say we are in the right context and we can carry on
                            EventReplayer.logWithContext(`Matched Vanilla Iframe on Name: Executing ${replayEvent.assertionId || replayEvent.replayEventId}`);
                            this.matched = true;
                        } else {
                            //then we are in a cross-domain iframe and we can log accordingly
                            EventReplayer.logWithContext(`Matched Cross-Domain Iframe Location Href: Executing ${replayEvent.assertionId || replayEvent.replayEventId}`);
                            this.matched = true;
                        }
                        break;
                    //IF WE HAVE A MISMATCH BETWEEN THE REPORTED FRAME TYPE AND THE CURRENT FRAME TYPE WE JUST SKIP
                    case EventReplayer.contextIsIframe() != replayEvent.recordingEventIsIframe:
                        EventReplayer.logWithContext(`Not Replaying ${replayEvent.assertionId || replayEvent.replayEventId} on Mismatch Frame Type Indication and Found`);
                        break;
                    //THIS NEEDS TO BE REPORTED AS AN EDGE CASE PROBLEM
                    default:
                        //then we are in a cross-domain iframe and we can log accordingly
                        EventReplayer.logWithContext(`ALERT: Unrecognised Case for Matched Location Href: Executing ${replayEvent.assertionId || replayEvent.replayEventId}`);
                        this.matched = true;
                    
                }

        }

    }

}