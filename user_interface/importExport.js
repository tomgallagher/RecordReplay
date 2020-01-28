$(document).ready (function(){

    $('#ImportData').on('dragover', event => {
        // Restrict handler to this one
        event.stopPropagation();
        // Prevent default behavior (Prevent file from being opened)
        event.preventDefault();
        //add the copy icon to the pointer
        event.originalEvent.dataTransfer.dropEffect = 'copy';
    });

    $('#ImportData').on('drop', async(event) => {
        console.log(event);
        // Restrict handler to this one
        event.stopPropagation();
        // Prevent default behavior (Prevent file from being opened)
        event.preventDefault();
        // Pick the File from the drop event (a File is also a Blob):
        const file = event.originalEvent.dataTransfer.files[0];
        if (!file) {
             //post the warning message of no file type
             $('#ImportData textarea').css('color', "red");
             $('#ImportData textarea').val('Only files can be dropped here');
             return;
        }
        //then we need to get the text from the file
        if (file.type != "application/json") {
            //post the warning message of unmatching file type
            $('#ImportData textarea').css('color', "red");
            $('#ImportData textarea').val(`Wrong File Type ${file.type}`);
        } else {
            $('.ui.file.segment .ui.import.form').addClass('loading');
            //get the text from the file
            const text = await file.text();
            //then update the database
            await StorageUtils.importDatabase('importExport.js', text);
            //then signal done
            $('.ui.file.segment .ui.import.form').removeClass('loading');
            $('#ImportData textarea').css('color', "green");
            $('#ImportData textarea').val('Record/Replay File - Import Complete');
            //then report
            ga('send', { hitType: 'event', eventCategory: 'JSONImport', eventAction: 'Drop', eventLabel: 'JSONData'});
            //activate menu buttons according to record counts
            enableVerticalMenuButtonsWhenDataAllows();

        }

    });


    $('#ExportData').on('click', async (event) => {

        // Prevent default behavior (Submit form)
        event.preventDefault();
        ga('send', { hitType: 'event', eventCategory: 'JSONExport', eventAction: 'Click', eventLabel: 'JSONData'});
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