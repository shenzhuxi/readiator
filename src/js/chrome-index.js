zip.workerScriptsPath = "bower_components/zip.js/WebContent/";
var epubLibrary = angular.module('epubLibrary', ['onsen.directives']);
epubLibrary.config(function($compileProvider){
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel|chrome-extension):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|chrome-extension):|data:image\//);
});
epubLibrary.config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        'filesystem:**',
        'chrome-extension:**'
    ]);
    $sceDelegateProvider.resourceUrlBlacklist([
    ]);
});
var filer = new Filer();

epubLibrary.controller('LibraryCtrl', ['$scope', '$location', '$http', function($scope, $location, $http) {
    angular.element(document).ready(function() {
        $scope.library = {
            loading: false,
            progress: 0,
            books: []
        };
        filer.init({persistent: true, size: 1024 * 1024 * 1000}, function(fs) {
          filer.mkdir('readiator/epub', false, function(dirEntry) {
          }, onError);
          filer.mkdir('readiator/books', false, function(dirEntry) {
          }, onError);
          scanBooks($scope);
        }, onError);
    });
    $scope.upload = function() {
        document.getElementById("epub-file").click();
    }
    $scope.refresh = function() {
        scanBooks($scope);
    }
    $scope.removeBook = function(name) {
        filer.cd('/', function(entries) {
            filer.rm('readiator/books/' + name, function() {
            }, onError); 
            filer.rm('readiator/epub/' + name, function() {
            }, onError);
        }, onError);
    };
}]);

epubLibrary.directive('epubFilesBind', function() {
    return function($scope, element, attrs) {
        element.bind('change', function(evt) {
            $scope.$apply(function() {
                var files = evt.target.files;
                //console.log(files);
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
    reader.onprogress = function(p) {
    }
    reader.onload = function() {
        var chunk = new Uint8Array(reader.result, 0, file.size);
        //console.log(chunk);
        var uuid = _rush.digestFromBuffer(chunk);
        callback(uuid, file);
    };
    reader.readAsArrayBuffer(file);
}

function openFiles($scope, files) {
    //console.log(files);
    if (files.length > 0) {
        var i = 0;
        //for (var i = 0; i < files.length; i++) {
        function loopFiles (files) {
            $scope.library.loading = true;
            sha1(files[i], function(uuid, file){
                filer.cd('/', function() {
                    filer.write('/readiator/epub/' + uuid + '.epub', {data: file, type: file.type}, function(fileEntry, fileWriter) {}, onError);
                    filer.mkdir('/readiator/books/' + uuid + '.epub/', false, function(dirEntry) {
                        $scope.library.progress = 0;
                        var zipFs = new zip.fs.FS();
                        zipFs.importBlob(file, function() {
                            zipFs.root.getFileEntry(dirEntry, function() {
                                //$scope.library.progress = Math.round((i+1/files.length) * 100);
                                $scope.library.loading = false;
                                scanBooks($scope);
                                i++;
                                if(i < files.length) {
                                    loopFiles(files);   
                                }
                            }, function(p, max){
                                $scope.library.progress = Math.round((p/max) * 100);
                                $scope.$apply();
                            }, onError);
                        }, onError);
                    }, onError);
                }, onError);
            });
        }
        loopFiles(files);
    }
}

function scanBooks($scope) {
    $scope.library.books = [];
    filer.cd('/', function(entries) {
        filer.ls('/readiator/books/', function(entries) {
            //console.log(filer);
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
                            author: book.metadata.creator,
                            url: 'viewer.html?epub=' + url,
                            cover: cover
                        });
                        $scope.$apply();
                    });
                }
            });
            $scope.$apply();
        }, onError);
    }, onError);
}

