try {
    var service = analytics.getService('Readiator');
    var tracker = service.getTracker('UA-331449-9');
}
catch(err) {
    console.log(err);
}

zip.workerScriptsPath = "bower_components/zip.js/WebContent/";
var epubLibrary = angular.module('epubLibrary', []);

epubLibrary.config(function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel|filesystem|chrome-extension):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|filesystem|chrome-extension):|data:image\//);
});
epubLibrary.config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        'filesystem:**',
        'chrome-extension:**'
    ]);
    $sceDelegateProvider.resourceUrlBlacklist([]);
});
epubLibrary.config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
}]);

var filer = new Filer();

epubLibrary.controller('LibraryCtrl', ['$scope', '$location', '$http', function($scope, $location, $http) {
    if ($location.search().update) {
        var dialog = document.querySelector('#update');
        dialog.showModal();
    }
    angular.element(document).ready(function() {
        $scope.library = {
            loading: false,
            progress: 0,
            books: []
        };
        filer.init({
            persistent: true,
            size: 1024 * 1024 * 1000
        }, function(fs) {
            filer.mkdir('readiator/epub', false, function(dirEntry) {}, onError);
            filer.mkdir('readiator/books', false, function(dirEntry) {}, onError);
            scanBooks($scope);
        }, onError);
        if ($location.search().epub) {
            $http({
                url: $location.search().epub,
                method: "GET",
                responseType: "blob"
            }).success(function(response){
                var fileInput = document.getElementById("epub-file");
                var file = new File([response], "tmp.epub");
                openFiles($scope, [file]);
            }).error(function(errorResp){
                console.log('error');
            });
        }
        snackbarContainer.MaterialSnackbar.showSnackbar(data);
        tracker.sendAppView('index');
        tracker.sendEvent('Browsing', 'Browse the library');
    });
    $scope.closeDialog = function() {
        document.querySelector('dialog').close();
    }
    $scope.upload = function() {
        document.getElementById("epub-file").click();
    }
    $scope.refresh = function() {
        scanBooks($scope);
    }
    $scope.removeBook = function(name) {
        filer.cd('/', function(entries) {
            filer.rm('readiator/books/' + name, function() {}, onError);
            filer.rm('readiator/epub/' + name, function() {}, onError);
        }, onError);
    };
}]);

epubLibrary.directive('epubFilesBind', function() {
    return function($scope, element, attrs) {
        element.bind('change', function(evt) {
            $scope.$apply(function() {
                var files = evt.target.files;
                openFiles($scope, files);
            });
        });
    };
});

epubLibrary.directive('ngFilesDrop', function() {
    return function($scope, element, attrs) {
        element.bind('dragover', function(evt) {
            evt.preventDefault();
        });
        element.bind('drop', function(evt) {
            evt.preventDefault();
            $scope.$apply(function() {
                openFiles($scope, evt.dataTransfer.files);
            });
        });
    };
});

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
        callback(uuid, file);
    };
    reader.readAsArrayBuffer(file);
}

function openFiles($scope, files) {
    console.log(files);
    if (files.length > 0) {
        var i = 0;
        function loopFiles(files) {
            if (files[i].name.split(".").pop().toLowerCase() == 'epub') {
                $scope.library.loading = true;
                //var uuid = EPUBJS.core.uuid();
                //var file = files[i];
                sha1(files[i], function(uuid, file) {
                    filer.cd('/', function() {
                        filer.write('/readiator/epub/' + uuid + '.epub', {
                            data: file,
                            type: file.type
                        }, function(fileEntry, fileWriter) {}, onError);
                        filer.mkdir('/readiator/books/' + uuid + '.epub/', false, function(dirEntry) {
                            $scope.library.progress = 0;
                            /*var reader = new FileReader();
                            reader.onload = function() {
                              var zip = new JSZip(reader.result);
                              for (var entry in zip.files) {
                                  if (zip.files[entry].options.dir) {
                                      console.log('/readiator/epub/' + uuid + '/' + entry);
                                      filer.mkdir('/readiator/epub/' + uuid + '/' + entry, false, function(dirEntry) {
                                      }, onError);
                                  }
                                  else {
                                      //console.log(zip.files[entry]);
                                      var uint8 = zip.files[entry].asText();
                                      console.log(zip.files[entry]);
                                          filer.write('/readiator/epub/' + uuid + '/' + entry, {
                                              data: 'uint8',
                                              type: 'text/txt'
                                          }, function(fileEntry, fileWriter) {}, onError);
                                  }
                              }
                            };
                            reader.readAsArrayBuffer(file);
                            */
                            var zipFs = new zip.fs.FS();
                            zipFs.importBlob(file, function() {
                                zipFs.root.getFileEntry(dirEntry, function() {
                                    //$scope.library.progress = Math.round((i+1/files.length) * 100);
                                    $scope.library.loading = false;
                                    scanBooks($scope);
                                    i++;
                                    if (i < files.length) {
                                        loopFiles(files);
                                    }
                                }, function(p, max) {
                                    $scope.library.progress = Math.round((p / max) * 100);
                                    $scope.$apply();
                                }, onError);
                            }, function(){
                                filer.rm(dirEntry.fullPath, function() {}, onError);
                                //TODO: Modal message
                                onError;
                            });
                        }, onError);
                    }, onError);
                });
            }
        }
        loopFiles(files);
    }
}

function scanBooks($scope) {
    $scope.library.books = [];
    filer.cd('/', function(entries) {
        filer.ls('/readiator/books/', function(entries) {
            entries.forEach(function(entry) {
                if (entry.isDirectory) {
                    var url = 'filesystem:' + location.protocol + '//' + location.host + '/persistent' + entry.fullPath + '/';
                    var book = ePub(url, {
                        restore: false
                    });
                    book.on("book:ready", function() {
                        var cover = book.contents.coverPath ? book.cover : 'img/Epub_logo_color.svg.png';
                        $scope.library.books.push({
                            name: entry.name,
                            title: book.metadata.bookTitle,
                            author: book.metadata.creator ? book.metadata.creator : 'Unknown',
                            url: 'viewer.html?epub=' + url + '&uuid=' + entry.name,
                            cover: cover,
                            isbn: book.metadata.identifier,
                            file: 'filesystem:' + location.protocol + '//' + location.host + '/persistent/readiator/epub/' + entry.name
                        });
                        $scope.$apply();
                        componentHandler.upgradeDom('MaterialMenu', 'mdl-menu');
                    });
                }
            });
            $scope.$apply();
            tracker.sendEvent('Browsing', 'Scan the library', entries.length);
        }, onError);
    }, onError);
}
