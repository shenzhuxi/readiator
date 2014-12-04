var Book;
// Set up context menu at install time.
chrome.runtime.onInstalled.addListener(function() {
    var context = "selection";
    var title = "Share with Twitter";
    var id = chrome.contextMenus.create({
        "title": title,
        "contexts": [context],
        "id": "context" + context
    });
});

// add click event
chrome.contextMenus.onClicked.addListener(onClickHandler);

// The onClicked callback function.
function onClickHandler(info, tab) {
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
