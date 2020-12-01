const assessKeyboardSelectors = async (replayEvent, tabId, url) => {
    //the first thing is to get an array of DomSelectorReports, which tell us if we can find the selector attached to the keyboard event
    const reportArray = await Promise.all([
        //each of these reports executes some javascript in the page to see if the relevant selectors can be found
        new DomSelectorReport({
            key: 'CssSelector',
            replayEvent: replayEvent,
            browserTabId: tabId,
            currentUrl: url,
        }),
        new DomSelectorReport({
            key: 'OptimalSelector',
            replayEvent: replayEvent,
            browserTabId: tabId,
            currentUrl: url,
        }),
        new DomSelectorReport({
            key: 'RecordReplaySelector',
            replayEvent: replayEvent,
            browserTabId: tabId,
            currentUrl: url,
        }),
        //we end up with an array like this [HTMLInputElement, null, HTMLInputElement], depending on how well the selectors have worked
    ]);
    //then we collect the information about invalid and valid items into the replay event
    const fails = reportArray.filter((r) => r.invalidSelector);
    //if we have any fails we need to report them and save them
    if (fails.length > 0) {
        replayEvent.replayErrorMessages.push(fails.map((r) => r.warningMessages).join(', '));
        replayEvent.failedReplaySelectorReports = fails;
    }
    //then successes need logs and saving to replay as well
    const successes = reportArray.filter((r) => !r.invalidSelector);
    if (successes.length > 0) {
        console.log(`Tab Runner: ${successes.length} selector reports matched`);
        replayEvent.replayLogMessages.push(successes.map((r) => r.logMessages).join(', '));
        replayEvent.replaySelectorReports = successes;
    }
    //then we need to action. If we have no successes, we should update the replay and send the message back to the UI
    if (successes.length === 0) {
        //then we need to push an error message to the logs
        replayEvent.replayErrorMessages.push(`Tab Runner: No Valid Target On Page`);
        //otherwise we report the time of the fail
        replayEvent.replayEventReplayed = Date.now();
        //and we set the status to false to indicate a failed replay
        replayEvent.replayEventStatus = false;
        //then send the response if we have the facility
        if (replayEvent.sendResponse != null) {
            //first we make a clone of this
            var replayExecution = Object.assign({}, replayEvent);
            //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
            delete replayExecution.sendResponse;
            //then we send the clean clone
            replayEvent.sendResponse({ replayExecution: replayExecution });
        }
    } else {
        //here we have some succcess, so we need to report that
        replayEvent.chosenSelectorReport = successes.sort(
            (a, b) => a.selectorString.length - b.selectorString.length
        )[0];
    }
    //and we're done, the true or false status will determine whether further processing takes place
    return replayEvent;
};

const focusKeyboardEvent = async (replayEvent, tabId, currentUrl) => {
    /*
        creating focus is the big issue for actioning keyboard events through the Remote Debugging Protocol
        in particular, we have three different types of situation:
        1) we are looking for the item on the main page
        2) we are looking for an item on the main page but in an iframe
        3) we are looking for an item in an iframe from a different domain
    */
    const mainFrame = !replayEvent.recordingEventIsIframe;
    const localIframe = replayEvent.recordingEventIsIframe && replayEvent.recordingEventLocationHref === currentUrl;
    const foreignIframe = replayEvent.recordingEventIsIframe && replayEvent.recordingEventLocationHref !== currentUrl;

    //we need to pass quite complicated code instructions, for which we will need an array and the selector shorthand
    let codeInstructions = [];
    //we need the selector
    let selector = replayEvent.chosenSelectorReport.selectorString;
    //main frame FOCUS first as that's the easy bit
    if (mainFrame) {
        //we need to find the element that we want to focus
        codeInstructions.push(`var el = document.querySelector('${selector}');`);
        //then we focus it
        codeInstructions.push(
            `if (el) { console.log('${selector} ELEMENT FOUND: ' + window.location.href); el.focus({ preventScroll: false }); }`
        );
        //then join the code instructions with a space
        const code = codeInstructions.join(' ');
        //and try to execute the code
        try {
            await executeScriptInMainFrame(tabId, code);
            //we also need to report context here
            console.log(`FOCUS on ${replayEvent.recordingEventHTMLElement} in main_frame`);
        } catch (e) {
            console.warn(e.message);
        }
    }
    //then local iframe
    if (localIframe) {
        //first we need to find the frame
        codeInstructions.push(
            `var frame = document.querySelector('iframe[name="${replayEvent.recordingEventIframeName}"]');`
        );
        //then there is only any point in reporting or acting on success
        codeInstructions.push(`if (frame) {`);
        //report that we have found the iframe
        codeInstructions.push(
            `console.log('${replayEvent.recordingEventIframeName} FRAME FOUND in: ' + window.location.href);`
        );
        //then focus on the iframe body as the first attempt to focus
        codeInstructions.push(`frame.contentWindow.focus();`);
        //then search the iframes content document for the particular element we want to focus
        codeInstructions.push(`var element = frame.contentDocument.querySelector('${selector}');`);
        //only ever any point in reporting if we have found the element
        codeInstructions.push(
            `if (element) { console.log('${selector} ELEMENT FOUND: ' + window.location.href); element.focus(); }`
        );
        //KEY STEP: then get the bounding client rect, which works as a proxy for giving focus to troublesome iframes. Who knew?
        codeInstructions.push(`frame.getBoundingClientRect();`);
        //close the frame block
        codeInstructions.push(`}`);
        //then join the code instructions with a space
        const code = codeInstructions.join(' ');

        //and try to execute the code
        try {
            await executeScriptInMainFrame(tabId, code);
            //we also need to report context here
            console.log(`FOCUS on ${replayEvent.recordingEventHTMLElement} in vanilla_iframe`);
        } catch (e) {
            console.warn(e.message);
        }
    }

    //then foreign frame
    if (foreignIframe) {
        codeInstructions.push(
            `var element = document.querySelector('${selector}'); if (element) { element.focus({ preventScroll: false }); }`
        );
        //then join the code instructions with a space
        const code = codeInstructions.join(' ');
        //and try to execute the code, with the frame id collected by the selector reports
        try {
            await executeScriptInSubFrame(tabId, code, replayEvent.chosenSelectorReport.successFrameId);
            console.log(`FOCUS on ${replayEvent.recordingEventHTMLElement} in foreign_frame`);
        } catch (e) {
            console.warn(e.message);
        }
    }
    //then return the replay event for further processing
    return replayEvent;
};

const actionKeyBoardEvent = async (replayEvent, tabId) => {
    //when we recorded the event, we created an event object matching the CDP required params for KEYDOWN
    let event = replayEvent.recordingEventDispatchKeyEvent;
    //so we can just execute that keydown event first
    try {
        await sendKeyboardEvent(tabId, event);
    } catch (e) {
        //if we have an error, we should report to the console
        console.warn(e);
        // we report the time of the fail
        replayEvent.replayEventReplayed = Date.now();
        //and we set the status to false to indicate a failed replay
        replayEvent.replayEventStatus = false;
        //and we need to provide information on why the replay failed
        replayEvent.replayLogMessages.push(`KEY DOWN: ${e}`);
        //then send the response if we have the facility
        if (replayEvent.sendResponse != null) {
            //first we make a clone of this
            var replayExecution = Object.assign({}, replayEvent);
            //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
            delete replayExecution.sendResponse;
            //then we send the clean clone
            replayEvent.sendResponse({ replayExecution: replayExecution });
        }
        //then we can just return
        return replayEvent;
    }
    //if we're still good we need to execute the keyup event, by a simple mutation of one property
    //the type needs to be changed from "keyDown" or "rawKeyDown" to "keyup"
    event.type = 'keyUp';
    try {
        await sendKeyboardEvent(tabId, event);
    } catch (e) {
        //if we have an error, we should report to the console
        console.warn(e);
        // we report the time of the fail
        replayEvent.replayEventReplayed = Date.now();
        //and we set the status to false to indicate a failed replay
        replayEvent.replayEventStatus = false;
        //and we need to provide information on why the replay failed
        replayEvent.replayLogMessages.push(`KEY UP: ${e}`);
        //then send the response if we have the facility
        if (replayEvent.sendResponse != null) {
            //first we make a clone of this
            var replayExecution = Object.assign({}, replayEvent);
            //then we delete the sendResponse function from the clone, just to avoid any confusion as it passes through messaging system
            delete replayExecution.sendResponse;
            //then we send the clean clone
            replayEvent.sendResponse({ replayExecution: replayExecution });
        }
        //then we can just return
        return replayEvent;
    }
    //then we can just return
    return replayEvent;
};
