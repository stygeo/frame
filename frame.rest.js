$(function() {
  if(!('Frame' in window)) { throw new Error("Included frame.rest but Frame is undefined"); }

  var RestStore = Frame.DataStore.extend({
    constructor: function(baseUrl, options) {
      Frame.DataStore.call(this);

      this.baseUrl = baseUrl;
      this.defaultKey = options.key || 'id';
    },

    // Fetch given resource
    fetch: function(object, parameters, options) {
      if(!options) options = {};

      var url = this.urlForObject(object);
      var originalSuccess = options.success;
      options.data = parameters;
      options.success = function(data, textStatus, xhr) {
        object.serialize(data);
        // Since it's fetched, it ain't new.
        object.isNew = false;

        if(originalSuccess) originalSuccess.call(object, data, textStatus, xhr);

        // Trigger fetch event
        object.trigger("fetch");
      };

      this.findByQueryWithUrl(parameters, url, options);
    },

    add: function(object, options) {
      if(!options) options = {};

      var url = this.urlForObject(object);
      var originalSuccess = options.success;

      // Construct the options
      options.data = {};
      options.data[object.resource.singularize()] = object.toJSON();
      options.success = function(data, textStatus, xhr) {
        object.serialize(data);
        // Object has been saved, it's no longer new
        object.isNew = false;

        if(originalSuccess) originalSuccess.call(object, data, textStatus, xhr);
      };

      this.addWithUrl(url, options);
    },

    update: function(object, options) {
      if(!options) options = {};

      var url = this.urlForObject(object);
      var originalSuccess = options.success;

      // Construct the options
      options.data = {};
      options.data[object.resource.singularize()] = object.toJSON();
      options.success = function(data, textStatus, xhr) {
        object.serialize(data);

        if(originalSuccess) originalSuccess.call(object, data, textStatus, xhr);
      };

      this.updateWithUrl(url, options);
    },

    destroy: function(object, options) {
      if(!options) options = {};

      var url = this.urlForObject(object);
      var originalSuccess = options.success;

      options.success = function(data, textStatus, xhr) {
        if(originalSuccess) originalSuccess.call(object, data, textStatus, xhr);
      };
      this.destroyWithUrl(url, options);
    },

    all: function(collection, model, options) {
      if(!options) options = {};

      var url = this.urlForObject(model);
      var originalSuccess = options.success;

      collection = collection || new Frame.Collection();
      options.success = function(data, textStatus, xhr) {
        var serializedObjects = [];

        for(var i = 0; i < data.length; i++) {
          var o = new model(data[i]);
          o.isNew = false;

          serializedObjects.push(o);
        }

        collection.reset(serializedObjects);

        if(originalSuccess) originalSuccess.call(collection, collection, data, textStatus, xhr);
      }

      this.findAllByQueryWithUrl(url, options);
    },

    findAllByQueryWithUrl: function(url, options) {
      this.request('GET', url, options);
    },

    addWithUrl: function(url, options) {
      this.request('POST', url, options);
    },

    updateWithUrl: function(url, options) {
      this.request('PATCH', url, options);
    },

    findByQueryWithUrl: function(query, url, options) {
      this.request('GET', url, options);
    },

    destroyWithUrl: function(url, options) {
      this.request('DELETE', url, options);
    },

    // jQuery AJAX wrapper
    request: function(type, url, options) {
      $.ajax(url, {
        type: type,
        data: options.data,
        success: function(data, textStatus, xhr) {
          if(options.success) options.success.call(this, data, textStatus, xhr);
        },
        error: function(xhr, status, err) {
          console.log("XHR error:", err);
        },
        async: ('async' in options ? options.async : true),
      })
    },

    // Default URL for restful stores
    defaultUrl: function(object, isResource) {
      var base = [Frame.defaultStore.baseUrl, object.resource]

      if(isResource && object[Frame.defaultStore.defaultKey]) {
        base.push(object[Frame.defaultStore.defaultKey]);
      }

      return base.join('/');
    },

    // Generate url for object/resource
    urlForObject: function(object) {
      // Object could possibly be interface
      var url;
      if(object.prototype) {
        url = this.defaultUrl(object.prototype);
      } else if(!object.url) {
        url = this.defaultUrl(object, true);
      } else {
        url = ($.isFunction(object.url) ? object.url() : object.url);
      }

      return url;
    },
  });

  Frame.RestStore = RestStore;

  // Register AMD module.
  if(typeof define === "function" && define.amd) {
    define("frame.rest", [], function() { return Frame; });
  }
});
