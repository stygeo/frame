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
      var url = this.urlForObject(object);
      var originalSuccess = options.success;
      options.data = parameters;
      options.success = function(data, textStatus, xhr) {
        object.serialize(data);

        if(originalSuccess) originalSuccess.call(object, data, textStatus, xhr);
      };

      this.findByQueryWithUrl(parameters, url, options);
    },

    add: function(object, options) {
      var url = this.urlForObject(object);
      var originalSuccess = options.success;

      // Construct the options
      options.data = {};
      options.data[object.resource.singularize()] = object.toJSON();
      options.success = function(data, textStatus, xhr) {
        object.serialize(data);

        if(originalSuccess) originalSuccess.call(object, data, textStatus, xhr);
      };

      this.addWithUrl(url, options);
    },

    destroy: function(object, options) {
      var url = this.urlForObject(object);

      this.destroyWithUrl(url, {
        success: function(data, textStatus, xhr) {
          if(options.success) options.success.call(object, data, textStatus, xhr);
        },
      });
    },

    all: function(collection, model, options) {
      var url = this.urlForObject(model);
      var originalSuccess = options.success;

      collection = collection || Frame.Collection();
      options.success = function(data, textStatus, xhr) {
        var serializedObjects = [];

        var o1, o2, o3;
        for(var i = 0; i < data.length; i++) {
          var object = new model(data[i]);
          if(i === 0) o1 = object;
          if(i === 1) o2 = object;
          if(i === 2) o3 = object;
          collection.push(object);
        }

        //collection.reset(serializedObjects);

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
        error: function(e) {
          console.log(e);
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
});
