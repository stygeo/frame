$(function() {
  if(!('Frame' in window)) throw Error("Frame not defined");

  Frame.storeDefinition = undefined;

  // Define indexeddb
  window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
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
      if(!options) options = {};

      Frame.DataStore.call(this);

      this.db = null;

      this.defaultKey = options.key || 'id';
    },

    open: function(name, callback, options) {
      if(!options) options = {};

      var version = options.version || 3;
      var request = indexedDB.open(name, version);

      $this = this;

      // We can only create Object stores in a version change transaction.
      request.onupgradeneeded = function(e) {
        var db = e.target.result;

        // A version change transaction is started automatically.
        e.target.transaction.onerror = IndexedDB.onerror;

        for(var key in $this.definition) {
          var storeName = key;
          var storeDefinition = $this.definition[key];

          if(db.objectStoreNames.contains(storeName)) {
            db.deleteObjectStore(storeName);
          }

          // Create a new object store for the given store name
          var store = db.createObjectStore(storeName, storeDefinition);

          if(storeDefinition.indices) {
            //store.createIndex(_.keys(storeDefinition.indices).join(","), _.keys(storeDefinition.indices));
            for(var index in storeDefinition.indices) {
              store.createIndex(index, index, { unique: storeDefinition.indices[index] })
            }
          }
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

    destroy: function(object, options) {
      if(!options) options = {};

      this.destroyByStoreName(object.objectName, object.id, options);
    },

    find: function(object, query, options) {
      if(!options) options = {};

      var objectName = object.prototype.objectName;

      if(typeof(query) === 'object') {
        this.findAllByQueryStoreName(object, query, options);
      } else {
        this.findByQueryStoreName(object, query, options);
      }
    },

    // Fetch given resource
    fetch: function(object, parameters, options) {
      this.findByQueryStoreName(object, object[this.defaultKey], {
        success: function(data, evt) {
          object.serialize(data);

          if(options.success) options.success.call(object, data, evt);
        },

        data: parameters,
      });
    },

    findByQueryStoreName: function(object, id, options) {
      if(!options) options = {};

      var storeName = object.objectName,
          db = this.db,
          trans = db.transaction([storeName], "readwrite"),
          store = trans.objectStore(storeName),
          model = object;

      // Fetch object
      var request = store.get(id);

      request.onsuccess = function(e) {
        if(options.success) {
          // Call the success callback.
          options.success(e.target.result, e);
        }
      };

      request.onerror = function(e) {
        console.log("Error Adding: ", e);
      };
    },

    findAllByQueryStoreName: function(object, query, options) {
      if(!options) options = {};

      var storeName = object.prototype.objectName,
          db = this.db,
          trans = db.transaction([storeName], "readwrite"),
          store = trans.objectStore(storeName),
          model = object;

      var keys = _.keys(query),
          values = _.values(query);

      var collection = [];
      var request = store.index(keys).openCursor(IDBKeyRange.only(values.length == 1 ? values[0] : values));
      request.onsuccess = function(e) {
        var result = e.target.result;

        if(result) {
          // Create a new model
          var object = new model(e.target.result);

          // Push the object in the returning collection
          collection.push(object);

          // Next item
          result.continue();
        } else {
          // When we're done call the success callback
          if(options.success) {
            options.success(collection, e.target.result, e);
          }
        }
      };

      request.onerror = function(e) {
        console.log("Error Adding: ", e);
      };
    },

    add: function(object, options) {
      if(!options) options = {};

      var storeName = object.objectName;
      var serializedData = object.toJSON();
      this.addByStoreName(storeName, object, serializedData, options);
    },

    addByStoreName: function(storeName, object, data, options) {
      if(!options) options = {};

      var db = this.db,
          trans = db.transaction([storeName], "readwrite"),
          store = trans.objectStore(storeName);

      if(!('createdAt' in data)) data.createdAt = new Date();

      var request = store.put(data);

      request.onsuccess = function(e) {
        if(options.success) {
          // Serialize attributes back to the object
          var attributes = {};
          attributes[e.target.source.keyPath] = e.target.result;

          object.serialize(attributes);

          options.success(object, e.target.result, e);
        }
      };

      request.onerror = function(e) {
        console.log("Error Adding: ", e);
      };
    },

    destroyByStoreName: function(storeName, id, options) {
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
        console.log("Error Removing: ", e);
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
