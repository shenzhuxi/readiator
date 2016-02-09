var epubViewer = angular.module('epubViewer', []);
        var index = lunr(function () {
            this.field('title', {boost: 10})
            this.field('body')
            this.ref('id')
        });

epubViewer.config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
}]);

epubViewer.config(function($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    // Allow same origin resource loads.
    'self',
    // Allow loading from our assets domain.  Notice the difference between * and **.
    'filesystem:**'
  ]);

  // The blacklist overrides the whitelist so the open redirect here is blocked.
  $sceDelegateProvider.resourceUrlBlacklist([
  ]);
});

var Book = ePub({
    version: 1,
    restore: false,
    storage: false,
    spreads: false,
    fixedLayout: false,
    styles: {},
});

epubViewer.controller('BookCtrl', ['$scope', '$location', '$http', function($scope, $location, $http) {
    angular.element(document).ready(function() {
        $uuid = $location.search().uuid;
        if (localStorage[$uuid]) {
            $scope.book = JSON.parse(localStorage[$uuid]);
            if ($scope.book.textSize === undefined) {
              $scope.book.textSize = 100;
            }
        } 
        else {
            $scope.book = {
                begin: true,
                end: false,
                chapter: '',
                spinePos: $location.hash() ? $location.hash() : 0,
                textSize: 100,
                pageXOffset: 0,
                pageYOffset: 0
            };
        }
        if ($location.search().epub) {
            Book.open($location.search().epub);
        }
    });
    angular.element(window).on('keypress', function(e) {
        shortcutKey(e, $scope);
    });
    $scope.prevChapter = function() {
        if ($scope.book.spinePos > 0) {
            $scope.book.spinePos = $scope.book.spinePos - 1;
            $scope.book.chapter = Book.spine[$scope.book.spinePos].url;
        }
    };
    $scope.nextChapter = function() {
        if ($scope.book.spinePos < Book.spine.length - 1) {
            $scope.book.spinePos = $scope.book.spinePos + 1;
            $scope.book.chapter = Book.spine[$scope.book.spinePos].url;
        }
    };
    $scope.fontChange = function(zoom) {
      $scope.book.textSize = $scope.book.textSize + zoom;
      var iframe = document.getElementById("epubjs-iframe");
      iframe.contentWindow.document.body.style.fontSize = $scope.book.textSize + '%';
    };
    $scope.search = function(keyEvent) {
        if (keyEvent.which === 13) {
            var query = keyEvent.srcElement.value;
            console.log(index.search(query));
            //var iframe = document.getElementById("epubjs-iframe");
            //if (iframe.contentWindow.find(query) == false) {
                //$scope.book.spinePos = $scope.book.spinePos + 1;
                //$scope.book.chapter = Book.spine[$scope.book.spinePos].url;
            //}
        }
    }
    Book.on("book:ready", function() {
        //console.log(Book);
        $scope.book.metadata = Book.metadata;
        if (Book.contents.coverPath) {
            //scope.book.chapter = Book.cover;
        }
        $scope.book.chapter = Book.spine[$scope.book.spinePos].url;
        try {
            var $select = document.getElementById("book-toc"),
                docfrag = document.createDocumentFragment();
            var items = generateTocItems(Book.toc);
            docfrag.appendChild(items);
            $select.appendChild(docfrag);
        }
        catch(err) {
            console.log(err);
        }
        $scope.book.metadata = Book.metadata;
        $scope.$apply();
        indexSpine(0);
        googleAnalytics(Book.contents);
    });
    function indexSpine(i) {
        href = Book.settings.contentsPath + Book.spine[i].href;
        $http({
            url: href,
            method: "GET",
            responseType: "document"
        }).success(function(response){
            var text = response.body.innerText;
            index.add({
                id: i,
                title: '',
                body: text
            });
            if (i+1 < Book.spine.length) {
                indexSpine(i+1);
            } else {
                console.log("Index accomplished!");
            }
        }).error(function(err){
            console.log(err);
        });
    }
}]);

epubViewer.directive('ngOnload', ['$location', function($location) {
    return function($scope, element, attrs) {
        element.bind('load', function() {
            if (attrs.name = 'epubjs-iframe') {
                element[0].contentWindow.addEventListener('keypress', function(e){
                    shortcutKey(e, $scope);
                });
                element[0].contentWindow.document.body.style.fontSize = $scope.book.textSize + '%';
                if ($scope.book.pageXOffset || $scope.book.pageYOffset) {
                    element[0].contentWindow.scrollTo($scope.book.pageXOffset, $scope.book.pageYOffset);
                    $scope.book.pageXOffset = 0;
                    $scope.book.pageYOffset = 0;
                }

                if (Book.spine) {
                    var i = 0;
                    for (i in Book.spine) {
                        if (element[0].contentWindow.location.href.split('#')[0].indexOf(Book.spine[i].url) > -1) {
                            $scope.book.spinePos = parseInt(i);
                            Book.spinePos = parseInt(i);
                            $location.hash(i);
                            break;
                        }
                    }
                    $scope.book.begin = false;
                    $scope.book.end = false;
                    if ($scope.book.spinePos == 0) {
                        $scope.book.begin = true;
                    }
                    if ($scope.book.spinePos == Book.spine.length - 1) {
                        $scope.book.end = true;
                    }
                }
                if (!$scope.$$phase) $scope.$apply();
            }
        });
    };
}]);

function shortcutKey(element, scope) {
    if (element.target.tagName == 'INPUT' || element.target.tagName == 'SELECT' || element.target.tagName == 'TEXTAREA' || element.target.isContentEditable) {
        return;
    } else {
        switch (element.code) {
            case "KeyP":
                scope.prevChapter();
                break;
            case "KeyN":
                scope.nextChapter();
                break;
        }
        scope.$apply();
    }
}

function generateTocItems(contents) {
    var list = document.createElement("ul");
    list.className = "list";
    contents.forEach(function(chapter) {
        var listItem = document.createElement("li");
        listItem.className = "list-item";
        var item = document.createElement("a");
        item.textContent = chapter.label;
        if (Book.contents.navPath) {
            var path = EPUBJS.core.folder(Book.contents.navPath);
        }
        if (Book.contents.tocPath) {
            var path = EPUBJS.core.folder(Book.contents.tocPath);
        }
        if (path) {
            item.href = Book.settings.contentsPath + path + chapter.href;
        } else {
            item.href = Book.settings.contentsPath + chapter.href;
        }
        item.target = 'epubjs-iframe';
        listItem.appendChild(item);
        list.appendChild(listItem);
        if (chapter.subitems && chapter.subitems.length) {
            var subitems = generateTocItems(chapter.subitems);
            listItem.appendChild(subitems);
        }
    });
    return list;
}

window.onbeforeunload = function (event) {
    var $scope = angular.element(document.body).scope();
    var iframe = document.getElementById("epubjs-iframe");
    $scope.book.pageXOffset = iframe.contentWindow.pageXOffset;
    $scope.book.pageYOffset = iframe.contentWindow.pageYOffset;
    localStorage.setItem($uuid, JSON.stringify($scope.book));
}

function _get_window_Yscroll() {
    var iframe = document.getElementById("epubjs-iframe");
    return iframe.contentWindow.pageYOffset || 
           iframe.contentDocument.body.scrollTop ||
           iframe.contentDocument.documentElement.scrollTop || 0;
}

function googleAnalytics(book) {
    var service = analytics.getService('Readiator');
    //service.getConfig().addCallback(initAnalyticsConfig);
    var tracker = service.getTracker('UA-331449-9');
    tracker.sendAppView('viewer');
    tracker.sendEvent('Reading', book.metadata.bookTitle);
}
