class MobileDeviceDictionary {

    //pass in an options object which can take new languages
    constructor(options) {
        
        // set default values for the keycodes class - UK keyboard
        const defaults = {

            1: {shortName: "Galaxy S5", longName: "Samsung Galaxy S5", width: 360, height: 640, deviceScaleFactor: 3},
            2: {shortName: "Pixel 2", longName: "Google Pixel 2", width: 411, height: 731, deviceScaleFactor: 2.625},
            3: {shortName: "Pixel 2 XL", longName: "Google Pixel 2 XL", width: 411, height: 823, deviceScaleFactor: 3.5},
            4: {shortName: "iPhone 5/SE", longName: "Apple iPhone 5/SE", width: 320, height: 568, deviceScaleFactor: 2},
            5: {shortName: "iPhone 6/7/8", longName: "Apple iPhone 6/7/8", width: 375, height: 667, deviceScaleFactor: 2},
            6: {shortName: "iPhone 6/7/8 Plus", longName: "Apple iPhone 6/7/8 Plus", width: 414, height: 736, deviceScaleFactor: 3},
            7: {shortName: "iPhone X", longName: "Apple iPhone X", width: 375, height: 812, deviceScaleFactor: 3},
            8: {shortName: "iPad", longName: "Apple iPad", width: 768, height: 1024, deviceScaleFactor: 2},
            9: {shortName: "iPad Pro", longName: "Apple iPad Pro", width: 1024, height: 1366, deviceScaleFactor: 2}
        
        }
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });
    }

}