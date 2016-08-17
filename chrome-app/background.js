var Book;
chrome.runtime.onInstalled.addListener(function(details){
    window.open(chrome.extension.getURL('index.html'), '_blank');
    if (details.reason == "install") {
        //console.log("This is a first install!");
    }
    else if (details.reason == "update") {
        var thisVersion = chrome.runtime.getManifest().version;
        if (thisVersion != details.previousVersion) {
            window.open(chrome.extension.getURL('index.html?update=' + thisVersion), '_blank');
            //console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
        }
    }
});
// Set up context menu at install time.
chrome.runtime.onInstalled.addListener(function() {
    /*
    chrome.contextMenus.create({
        "title": "Open the EPUB file",
        "contexts": ["link"],
        "onclick": openEpubHandler
    });*/

    chrome.contextMenus.create({
        "title": "Share to Twitter",//chrome.i18n.getMessage('open_in_new_tab'),
        "contexts": ["selection"],
        "onclick": shareSelectionHandler
    });
});

function openEpubHandler(info, tab) {
    var url = chrome.extension.getURL('index.html?epub=') + info.linkUrl;
    window.open(url, '_blank');
};

function shareSelectionHandler(info, tab) {
    var baseURL = chrome.extension.getURL('');
    if (tab.url.indexOf(baseURL) == 0) {
        var uuid = tab.url.substring(tab.url.lastIndexOf("uuid=")+5, tab.url.lastIndexOf("#"));
        var meta = '';
        if (localStorage[uuid]) {
            Book = JSON.parse(localStorage[uuid]);
            if (Book.metadata.creator && Book.metadata.bookTitle) {
              var meta = '\nFrom: ' + Book.metadata.creator + ', ' + Book.metadata.bookTitle;
            }
        }
    }
    else {
        var meta = ' from ' + tab.url;
    }
    var sText = info.selectionText;
    var url = 'https://twitter.com/share?text=' + encodeURIComponent(sText + meta + '\nvia ') + '&url=https://chrome.google.com/webstore/detail/readiator/ecoaijekbhjbbojbkgliclceljlgelbf?utm_source=twitter';
    window.open(url, '_blank');
};
