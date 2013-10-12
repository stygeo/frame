$(function() {
  if(!('Frame' in window)) { throw new Error("Included frame.rest but Frame is undefined"); }

  var RestStore = Frame.DataStore.extend({
    constructor: function(baseUrl, options) {
      Frame.DataStore.call(this);

      this.baseUrl = baseUrl;
      this.defaultKey = options.key || 'id';
    },
    destroy: function(object, options) {
    },

    // Fetch given resource
    fetch: function(object, parameters, options) {
      var url = this.urlForObject(object);

      this.findByQueryWithUrl(parameters, url, {
        success: function(data, textStatus, xhr) {
          object.serialize(data);

          if(options.success) options.success.call(object, data, textStatus, xhr);
        },

        data: parameters,
      });
    },
    add: function(object, options) {
    },


    findByQueryWithUrl: function(query, url, options) {
      this.request('GET', url, options);
    },

    request: function(type, url, options) {
      $.ajax(url, {
        type: type,
        success: function(data, textStatus, xhr) {
          if(options.success) options.success.call(this, data, textStatus, xhr);
        },
      })
    },

    // Default URL for restful stores
    defaultUrl: function() {
      var base = [Frame.defaultStore.baseUrl, this.resource]
      if(this[Frame.defaultStore.defaultKey]) {
        base.push(this[Frame.defaultStore.defaultKey]);
      }

      return base.join('/');
    },

    // Generate url for object/resource
    urlForObject: function(object) {
      // Object could possibly be prototype object
      if(!object.url) {
        object.url = this.defaultUrl;
      }

      return ($.isFunction(object.url) ? object.url() : object.url)
    },
  });

  Frame.RestStore = RestStore;
});
