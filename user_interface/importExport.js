$(document).ready (function(){

   //TO DO - ADD THE DRAG / DROP LISTENER 

    $('#ExportData').on('click', async () => {

        //get a copy of the database
        const blob = await StorageUtils.getExportedDatabase('importExport.js');
        //create a local temporary url - the object URL can be used as download URL
        var url = URL.createObjectURL(blob);
        //then download
        chrome.downloads.download({
            url: url,
            filename: "RecordReplayData.json"
        });

    });

});