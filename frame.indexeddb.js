$(function() {
  if(!('Frame' in window)) throw Error("Frame not defined");

  Frame.storeDefinition = undefined;

  // Define indexeddb
  window.indexedDB = window.indexedDB || window.webkitIndexedDB ||
    window.mozIndexedDB;
  if ('webkitIndexedDB' in window) {
    window.IDBTransaction = window.webkitIDBTransaction;
    window.IDBKeyRange = window.webkitIDBKeyRange;
  }

  var IndexedDB = {};
  IndexedDB.onerror = function(e) {
    console.log(e);
  };

  var Store = Frame.DataStore.extend({
    constructor: function(options) {
      this.db = null;
    },

    open: function(name, callback, options) {
      if(!options) options = {};

      var version = options.version || 3;
      var request = indexedDB.open(name, version);

      // We can only create Object stores in a version change transaction.
      request.onupgradeneeded = function(e) {
        var db = e.target.result;

        // A version change transaction is started automatically.
        e.target.transaction.onerror = IndexedDB.onerror;

        for(var i = 0; i < Frame.storeDefinition.length; i++) {
          var storeName = Frame.storeDefinition[i].storeName;

          if(db.objectStoreNames.contains(storeName)) {
            db.deleteObjectStore(storeName);
          }

          // Create a new object store for the given store name
          var store = db.createObjectStore(storeName, {keyPath: "id", autoIncrement: true});
        }
      };

      var $this = this;
      request.onsuccess = function(e) {
        $this.db = e.target.result;
        if(callback) {
          callback(e);
        }
      };

      request.onerror = IndexedDB.onerror;
    },

    add: function(object, options) {
      if(!options) options = {};

      var serializedData = object.toJSON();
      this.addByStoreName(object.objectName, serializedData, options);
    },

    addByStoreName: function(storeName, data, options) {
      if(!options) options = {};

      var db = this.db;
      var trans = db.transaction([storeName], "readwrite");
      var store = trans.objectStore(storeName);

      if(!('createdAt' in data)) data.createdAt = new Date();

      var request = store.put(data);

      request.onsuccess = function(e) {
        if(options.success) {
          options.success(request, e.target.result, e);
        }
      };

      request.onerror = function(e) {
        console.log("Error Adding: ", e);
      };
    },

    deleteByStoreName: function(storeName, id, options) {
      if(!options) options = {};

      var db = this.db;
      var trans = db.transaction([storeName], "readwrite");
      var store = trans.objectStore(storeName);

      var request = store.delete(id);

      request.onsuccess = function(e) {
        if(options.success) {
          options.success(e);
        }
      };

      request.onerror = function(e) {
        console.log("Error Adding: ", e);
      };
    },

    getAllByStoreName: function(storeName, options) {
      if(!options) options = {};

      var db = this.db;
      var trans = db.transaction([storeName], "readwrite");
      var store = trans.objectStore(storeName);

      // Get everything in the store;
      var cursorRequest = store.openCursor();

      cursorRequest.onsuccess = function(e) {
        var result = e.target.result;
        if(!!result == false)
          return;

        if(options.success) {
          options.success(result.value, e.target.result, e);
        }

        // Should the callback take care of this?
        result.continue();
      };

      cursorRequest.onerror = IndexedDB.onerror;
    },
  });

  Frame.IndexedStore = Store;
});
