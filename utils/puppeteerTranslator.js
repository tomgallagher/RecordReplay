class Puppeteer {

    //pass in an options object which can take new languages
    constructor(options) {
        
        // set default values for the keycodes class 
        const defaults = {

            //internal defaults
            recordingTestUrl: "",
            recordingTestID: 0,
            //messaging for code
            standardOpeningComment: "/*\n" 
            + "\t Your options for launching Puppeteer will depend upon your system setup and preferences. \n"
            + "\t The following code depends upon you having successfully launched Puppeteer with the reference 'browser'.\n"
            + "\t Don't forget to call 'browser.close()' at the end of your tests.\n"
            + "*/\n\n",
            standardRecordingComment: "/*\n" 
            + "\t This is code generated from a RECORDING. \n"
            + "\t As such it only contains ACTIONS, not ASSERTIONS.\n"
            + "\t If you want to have code with assertions included, you need to generate a replay of this recording and download the replay code.\n"
            + "*/\n\n",
            //puppeteer defaults
            defaultMouseButton: "left",
            defaultClicks: 1,
            defaultNetworkOffline: false,
            defaultNetworkDownload: -1,
            defaultNetworkUpload: -1,
            defaultLatency: 0

        }
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });
    }

    //ACTIONS

    openPage() { return `\t const page = await browser.newPage();` }

    navigateToUrl(url) { return `\t await page.goto('${url}');` }

    getTitle() { return `\t await page.title();` }

    click(selector, button = this.defaultMouseButton, clicks = this.defaultClicks) { return `\t await page.click('${selector}', { button: '${button}', clickCount: ${clicks} } ); `}

    //NOTE YOU MUST ALWAYS FOCUS BEFORE YOU TYPE
    typeText(text) { `\t await page.keyboard.type('${text}');` }

    sendSpecialKey(keyDescriptor) { `\t await page.keyboard.press('${keyDescriptor}');` }

    focus(selector) { return `\t await page.focus('${selector}');` }

    hover(selector) { return `\t await page.hover('${selector}');` }

    returnScreenshot() { return `\t await page.screenshot({path: 'screenshot.png'});` }

    closePage() { return `\t const page = await page.close();` }

    //SETTINGS special devtools queries - mobile view, bandwidth, latency

    connectToChromeDevtools() { return `\t const client  = await page.target().createCDPSession();` }

    emulateNetworkConditions(offline = this.defaultNetworkOffline, download = this.defaultNetworkDownload, upload = this.defaultNetworkUpload, latency = this.defaultLatency) {

        return `\t await client.send('Network.emulateNetworkConditions', { offline': ${offline}, 'downloadThroughput': ${download}, 'uploadThroughput': ${upload}, 'latency': ${latency} });`;

    }

    //ASSERTIONS HELPERS

    querySelector(selector) { return `\t await page.$('${selector}');` }

    querySelectorAll(selector) { return `\t await page.$$('${selector}');` }

    countElements(selector, index) { return `\t const count${index} = await page.$$eval('${selector}', elements => elements.length);` }

    getElementProperty(selector, property, index) { return `\t const ${property}Property${index} = await page.$eval('${selector}', element => element.${property});` }

    getElementAttribute(selector, attribute, index) { return `\t const ${attribute}Attribute${index} = await page.$eval('${selector}', element => element.getAttribute('${attribute}');` }

    getElementAttributesAsArray(selector, index) { return `\t const attributesArray${index} = await page.$eval('${selector}', element => Array.prototype.slice.call(element.attributes);` }

  
}