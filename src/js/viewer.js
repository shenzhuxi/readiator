var epubViewer = angular.module('epubViewer', ['onsen.directives']);

epubViewer.config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode(true);
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
            console.log(JSON.parse(localStorage[$uuid]));
            $scope.book = JSON.parse(localStorage[$uuid]);
        } 
        else {
            $scope.book = {
                begin: true,
                end: false,
                chapter: '',
                spinePos: $location.hash() ? $location.hash() : 0,
                pageXOffset: 0,
                pageYOffset: 0
            };
        }
        if ($location.search().epub) {
            Book.open($location.search().epub);
        }
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
    $scope.search = function(keyEvent) {
        if (keyEvent.which === 13) {
            var query = keyEvent.srcElement.value;
            var iframe = document.getElementById("epubjs-iframe");
            if (iframe.contentWindow.find(query) == false) {
                //$scope.book.spinePos = $scope.book.spinePos + 1;
                //$scope.book.chapter = Book.spine[$scope.book.spinePos].url;
            }
            //console.log(Index.search(query));
        }
    }
    Book.on("book:ready", function() {
        //console.log(Book);

        $scope.book.metadata = Book.metadata;
        if (Book.contents.coverPath) {
            //scope.book.chapter = Book.cover;
        }
        $scope.book.chapter = Book.spine[$scope.book.spinePos].url;

        var $select = document.getElementById("book-toc"),
            docfrag = document.createDocumentFragment();
        var items = generateTocItems(Book.toc);
        docfrag.appendChild(items);
        $select.appendChild(docfrag);
        $scope.book.metadata = Book.metadata;
        $scope.$apply();
    });
}]);

epubViewer.directive('ngOnload', ['$location', function($location) {
    return function($scope, element, attrs) {
        element.bind('load', function() {
            if (attrs.name = 'epubjs-iframe') {
              console.log($location);
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

function generateTocItems(contents) {
    var list = document.createElement("ons-list");
    list.className = "list ons-list-inner";
    contents.forEach(function(chapter) {
        var listItem = document.createElement("ons-list-item");
        listItem.className = "list__item ons-list-item";
        //listItem.setAttribute('modifier', "chevron");
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
