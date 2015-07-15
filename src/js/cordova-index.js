var epubLibrary = angular.module('epubLibrary', ['ngCordova']);

epubLibrary.controller('LibraryCtrl', ['$scope', '$http', '$cordovaFile', function($scope, $http, $cordovaFile) {
    angular.element(document).ready(function() {
        $scope.library = {
            loading: false,
            progress: 0,
            books: []
        };
        $cordovaFile.createDir('Readiator', false).then(function(result) {
            $cordovaFile.createDir('Readiator/epub', false).then(function(result) {}, onError);
            $cordovaFile.createDir('Readiator/books', false).then(function(result) {}, onError);
        }, onError);
        scanBooks($scope, $cordovaFile);
    });
    $scope.upload = function() {
        document.getElementById("epub-file").click();
    }
    $scope.refresh = function() {
        scanBooks($scope, $cordovaFile);
    }
    $scope.removeBook = function(name) {
        clearDirectory('Readiator/books/' + name);
        $cordovaFile.removeFile('Readiator/epub/' + name).then(function(result) {
            console.log(result);
        }, onError);
    };

    function clearDirectory(dir) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
            fileSystem.root.getDirectory(dir, {
                create: true,
                exclusive: false
            }, function(entry) {
                entry.removeRecursively(function() {
                    console.log("Remove Recursively Succeeded");
                }, onError);
            }, onError);
        }, onError);
    }
}]);

var app = {
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
        app.receivedEvent('deviceready');

    },

    receivedEvent: function(id) {
        angular.bootstrap(document.body, ['epubLibrary']);
        console.log('Received Event: ' + id);
    }
};

epubLibrary.directive('epubFilesBind', ['$cordovaFile', function($cordovaFile) {
    return function($scope, element, attrs) {
        element.bind('change', function(evt) {
            $scope.$apply(function() {
                $scope.library.loading = true;
                var files = evt.target.files;
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    //var uuid = EPUBJS.core.uuid();
                    sha1(file, function(uuid) {
                        $scope.library.progress = 0;
                        $cordovaFile.writeFile('Readiator/epub/' + uuid + '.epub', file).then(function(result) {
                            var zipfile = 'cdvfile://localhost/persistent/Readiator/epub/' + result.target.localURL.substring(result.target.localURL.lastIndexOf('/') + 1);
                            var dir = 'cdvfile://localhost/persistent/Readiator/books/' + result.target.localURL.substring(result.target.localURL.lastIndexOf('/') + 1) + '/';
                            zip.unzip(zipfile, dir, function(error) {
                                $scope.library.loading = false;
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log('unziped');
                                }
                                scanBooks($scope, $cordovaFile);
                            }, function(progressEvent) {
                                $scope.library.progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                                $scope.$apply();
                            });
                        }, onError);
                    });
                }
            });
        });
    };
}]);

function onError(e) {
    console.log(e);
}

function sha1(file, callback) {
    var reader = new FileReader();
    var pos = 0;
    var _rush = new Rusha();
    reader.onprogress = function(evt) {
        var $scope = angular.element(document.body).scope();
        $scope.library.progress = Math.round((evt.loaded/evt.total)*10);
    }
    reader.onload = function() {
        var chunk = new Uint8Array(reader.result, 0, file.size);
        var uuid = _rush.digestFromBuffer(chunk);
        console.log(uuid);
        callback(uuid);
    };
    reader.readAsArrayBuffer(file);
}

function scanBooks($scope, $cordovaFile) {
    $scope.library.books = [];
    $cordovaFile.listDir('Readiator/books').then(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isDirectory) {
                var book = ePub(entry.nativeURL, {
                    restore: false
                });
                book.on("book:ready", function() {
                    var cover = book.contents.coverPath ? book.cover : 'img/Epub_logo_color.svg.png';
                    $scope.library.books.push({
                        name: entry.name,
                        title: book.metadata.bookTitle,
                        author: book.metadata.creator,
                        url: 'viewer.html?epub=' + entry.nativeURL + '&uuid=' + entry.name,
                        cover: cover
                    });
                    $scope.$apply();
                    componentHandler.upgradeDom('MaterialMenu', 'mdl-menu');
                });
            }
        });
    }, onError);
}
