//define nampespace for storage
var StorageUtils = {};

//open database connection using dexie and unlimited storage
StorageUtils.openModelObjectDatabaseConnection = function(caller) {
  
    return new Promise(resolve => {
        //give the database a name - if it has already been defined then this just returns the existing database
        var db = new Dexie("modelObjectDatabase");
        //set up the database with the required fields - this is where we add fields in a second version so we can update users' databases
        db.version(1).stores({
            projects: "++id,projectName,projectDescription,projectAuthor,projectCreated",
            tests: "++id,testName,testDescription,testAuthor,testCreated,testProjectId,testProjectName,testStartUrl,testBandwidthValue,testBandwidthName,testLatencyValue,testLatencyName,testPerformanceTimings,testResourceLoads,testScreenshot",
            recordings: "++id,recordingName,recordingDescription,recordingAuthor,recordingCreated,recordingIsMobile,recordingMobileOrientation,recordingTestStartUrl,recordingProjectId,recordingProjectName,recordingTestId,recordingTestName,recordingTestBandwidthValue,recordingTestBandwidthName,recordingTestLatencyValue,recordingTestLatencyName,recordingTestPerformanceTimings,recordingTestResourceLoads,recordingTestScreenshot,recordingEventArray",
            replays: "++id,replayName,replayRecordingStartUrl,replayRecordingId,replayCreated,replayExecuted,replayFailTime,replayStatus,replayEventArray,recordingName,recordingDescription,recordingAuthor,recordingCreated,recordingIsMobile,recordingMobileOrientation,recordingTestStartUrl,recordingProjectId,recordingProjectName,recordingTestId,recordingTestName,recordingTestBandwidthValue,recordingTestBandwidthName,recordingTestLatencyValue,recordingTestLatencyName,recordingTestPerformanceTimings,recordingTestResourceLoads,recordingTestScreenshot,recordingEventArray"
        });
        //report that the database connection is open
        console.log(`${caller} has opened modelObjectDatabase Connection`);
        //then resolve with the open database connection
        resolve(db);
    });

};

 


//simple function to return all records count - this must be updated at same time as new tables are added
StorageUtils.getRecordsCount = function() {

    return new Promise(resolve => {

        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
        //then get all the records as a promise all, just projects at the moment
            .then(db => Promise.all( [ db.projects.count(), db.tests.count(), db.recordings.count(), db.replays.count() ] ) )
            //then we return each of them as a value array
            .then(valuesArray => {
                const countResponse = {
                    //start with projects and zeros for undefined tables
                    projects: valuesArray[0],
                    tests: valuesArray[1],
                    recordings: valuesArray[2],
                    replays: valuesArray[3]
                };
                resolve(countResponse);
            })
                
    });
};

//add a new model object to the database
StorageUtils.addModelObjectToDatabaseTable = function(caller, object, table) {

    return new Promise((resolve, reject) => {

        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //then with the opened database connection, add the new object to the database, using the object shorthand to get the right database
            .then(db => db[table].add(object) )
            //then this will return an ID, which we can use to log the successful operation
            .then(id => {
                //helps us to keep track of which operations have been performed and when
                console.log(`Storage has saved new model object with id ${id} to table ${table} for ${caller}`);
                resolve(id);
            })
            .catch(error => {
                //report a failed add using key, table and caller
                console.log(object);
                console.log (`Storage has failed to add model object to table ${table} for ${caller}`);
                reject(error);
            });
            
    });

};

//update an existing model object to the database
StorageUtils.updateModelObjectInDatabaseTable = function(caller, key, object, table) {

    return new Promise(resolve => {

        const checkedKey = StorageUtils.standardiseKey(key);
        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //then with the opened database connection, update the existing object to the database, using the object shorthand to get the right database
            .then(db => db[table].update(checkedKey, object) )
            //then this will return the number of updated records (1 if an object was updated, otherwise 0).
            .then(updated => {
                //helps us to keep track of which operations have been performed and when
                if (updated) {
                    //report a good update using key, table and caller
                    console.log (`Storage has updated model object with id ${key} in table ${table} for ${caller}`);
                } else {
                    //report a failed update in case of problems
                    console.log (`Storage has performed no update - either no model object with id ${key} or no changes detected`);
                }
                //resolve in any case
                resolve();
            });
            
    });

};

//delete an existing model object from the database
StorageUtils.deleteModelObjectInDatabaseTable = function(caller, key, table) {

    return new Promise((resolve, reject) => {

        const checkedKey = StorageUtils.standardiseKey(key);
        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //then with the opened database connection, update the existing object to the database, using the object shorthand to get the right database
            .then(db => db[table].delete(checkedKey) )
            //then this will return the number of updated records (1 if an object was updated, otherwise 0).
            .then(() => {
                //report a good delete using key, table and caller
                console.log (`Storage has deleted model object with id ${key} from ${table} table for ${caller}`);
                resolve();
            })
            //rejection happens if the provided key is not a valid key (not a Number, String, Date) or if the current transaction is readonly or inactive
            .catch(() => {
                //report a failed delete using key, table and caller
                console.log (`Storage has failed to delete model object with id ${key} from table ${table} for ${caller}`);
                reject();
            });
    });

};

//delete all items from all tables related to a specific project id
StorageUtils.cascadeDeleteByProjectID = function(caller, key) {

    return new Promise(resolve => {

        const checkedKey = StorageUtils.standardiseKey(key);
        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //then with the opened database connection, update the existing object to the database, using the object shorthand to get the right database
            .then(db => Promise.all([
                db.projects.delete(checkedKey),
                db.tests.filter(obj => obj.testProjectId == checkedKey).delete(),
                db.recordings.filter(obj => obj.recordingProjectId == checkedKey).delete(),
                db.replays.filter(obj => obj.recordingProjectId == checkedKey).delete()
            ]))
            .then(counts => {
                if (counts[0] > 1) { console.log(`cascadeDeleteByProjectID: Deleted ${counts[0]} projects for ${caller}.`); }
                if (counts[1] > 1) { console.log(`cascadeDeleteByProjectID: Deleted ${counts[1]} tests for ${caller}.`); }
                if (counts[2] > 1) { console.log(`cascadeDeleteByProjectID: Deleted ${counts[2]} recordings for ${caller}.`); }
                if (counts[3] > 1) { console.log(`cascadeDeleteByProjectID: Deleted ${counts[3]} replays for ${caller}.`); }
                resolve();
            });
            
    });

};

//delete all items from all tables related to a specific test id
StorageUtils.cascadeDeleteByTestID = function(caller, key) {

    return new Promise(resolve => {

        const checkedKey = StorageUtils.standardiseKey(key);
        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //then with the opened database connection, update the existing object to the database, using the object shorthand to get the right database
            .then(db => Promise.all([
                db.tests.delete(checkedKey),
                db.recordings.filter(obj => obj.recordingTestId == checkedKey).delete(),
                db.replays.filter(obj => obj.recordingTestId == checkedKey).delete()
            ]))
            .then(counts => {
                if (counts[0] > 1) { console.log(`cascadeDeleteByProjectID: Deleted ${counts[0]} tests for ${caller}.`); }
                if (counts[1] > 1) { console.log(`cascadeDeleteByProjectID: Deleted ${counts[1]} recordings for ${caller}.`); }
                if (counts[2] > 1) { console.log(`cascadeDeleteByProjectID: Deleted ${counts[1]} replays for ${caller}.`); }
                resolve();
            })
            .catch(err => console.log(`cascadeDeleteByTestID: ${err.message}`)); 
    
    });

};

//delete all items from all tables related to a specific recording id
StorageUtils.cascadeDeleteByRecordingID = function(caller, key) {

    return new Promise(resolve => {

        const checkedKey = StorageUtils.standardiseKey(key);
        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //then with the opened database connection, update the existing object to the database, using the object shorthand to get the right database
            .then(db => Promise.all([
                db.recordings.delete(checkedKey),
                db.replays.filter(obj => obj.replayRecordingId == checkedKey).delete()
            ]))
            .then(counts => {
                if (counts[0] > 1) { console.log(`cascadeDeleteByRecordingID: Deleted ${counts[0]} recordings for ${caller}.`); }
                if (counts[1] > 1) { console.log(`cascadeDeleteByRecordingID: Deleted ${counts[1]} replays for ${caller}.`); }
                resolve();
            })
            .catch(err => console.log(`cascadeDeleteByTestID: ${err.message}`)); 
    
    });

};

//return an array of model objects from the database
StorageUtils.getAllObjectsInDatabaseTable = function(caller, table) {

    return new Promise(resolve => {

        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //then with the opened database connection, get all the objects in the table as an array
            .then(db => db[table].toArray() )
            //then this will return the number of updated records (1 if an object was updated, otherwise 0).
            .then(array => {
                //report a good delete using key, table and caller
                console.log (`Storage has found ${array.length} model objects in ${table} table for ${caller}`);
                resolve(array);
            });
            
    });

};

//return a single model object from the database
StorageUtils.getSingleObjectFromDatabaseTable = function(caller, key, table) {

    return new Promise((resolve, reject) => {

        const checkedKey = StorageUtils.standardiseKey(key);
        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //retrieve the object
            .then(db => db[table].get(checkedKey) )
            //then resolve
            .then(object => resolve(object) )
            //If operation fails, returned promise will reject
            .catch(() => {
                //report a good delete using key, table and caller
                console.log (`Storage has failed to find model object with id ${key} from table ${table} for ${caller}`);
                reject();
            });
            
    });

};

//then we need a utility function to make sure that incoming keys are numbers, as required by the database, when we may be accessing them as strings from data properties
StorageUtils.standardiseKey = function(key) {

    //if the number is already an integer, as required by the database using auto-increment, then just return
    if (Number.isInteger(key)) { return key; }
    //otherwise we need to try to convert it
    else {
        //use the number function to attempt conversion
        const adjustedKey = Number(key);
        //then test that conversion has happened and return
        if (typeof adjustedKey == 'number' && adjustedKey % 1 === 0) { return adjustedKey }
        if (Number.isNaN(adjustedKey)) { throw `StorageUtils.standardiseKey: Incoming Key: ${typeof key} Adjusted Key: ${adjustedKey} is not a number!`; }
    }

}

//get entire database as json blob
StorageUtils.getExportedDatabase = function(caller) {

    return new Promise((resolve, reject) => {

        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //parse the whole database into a string
            .then(db => {
                return db.transaction('r', db.tables, ()=>{
                    return Promise.all(
                        db.tables.map(table => table.toArray().then(rows => ({table: table.name, rows: rows})))
                    );
                });
            })
            //then resolve
            .then(data => {
                const serialized =  JSON.stringify(data);
                //create a blob from the text - maybe set this to "text/plain" when we no longer want to use vscode to check formatting of emitted code
                var blob = new Blob([serialized], {type: "text/json"});
                resolve(blob);
            })
            //If operation fails, returned promise will reject
            .catch(() => {
                //report a good delete using key, table and caller
                console.log (`Storage has failed to export database for ${caller}`);
                reject();
            });
            
    });

};

//get entire database as json blob
StorageUtils.importDatabase = function(caller, jsonToImport) {

    return new Promise((resolve, reject) => {

        const dataToImport = JSON.parse(jsonToImport);
        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //parse the whole database into a string
            .then(db => {
                return db.transaction('rw', db.tables, () => {
                    return Promise.all(dataToImport.map(t => db.table(t.table).clear().then(()=>db.table(t.table).bulkAdd(t.rows))));
                });
            })
            //then resolve
            .then(() => resolve())
            //If operation fails, returned promise will reject
            .catch(() => {
                //report a good delete using key, table and caller
                console.log (`Storage has failed to import database for ${caller}`);
                reject();
            });
            
    });

};