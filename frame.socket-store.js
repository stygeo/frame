$(function() {
  if(!('Frame' in window)) { throw new Error("Included frame.socket-store but Frame is undefined"); }

  var SocketStore = Frame.DataStore.extend(
    [], {
    constructor: function(socket, options) {
      options = options || {};

      Frame.DataStore.call(this);

      this.socket = socket;

      // Set the channel if specified
      this.channelName = options.channel;

      this.registeredObjects = {}

      // Register the 'message' callback so we can intercept new resources
      this.binding = undefined;
      if(this.channelName) { this.binding = this.socket.channel(this.channelName); }
      else { this.binding = this.socket; }

      this.binding.on('resource_sync', _.bind(this.processData, this));
    },

    // Register a class the store can bind function to it such as incoming new resources
    register: function(object) {
      this.registeredObjects[object.prototype.resource] = object;
    },

    processData: function(event, data) {
      // Implemented custom protocol
      if(data.action && data.resource) {
        // It was a resource
        switch(data.action) {
          case 'new':
            var object = this.registeredObjects[data.resource];
            if(object) {
              object.trigger('new', new object(data.data));
            }
            break;

          case 'sync':
          case 'update':
            this.trigger([data.resource.singularize(), data.data.id, 'update'].join(":"), data.data);
            console.log('update')
            break;
          case 'sync':
        }
      }
    },

    // Sync
    sync: function(object, options) {
      // Bind a event on self so whenever the objects gets updated we can call 'sync' on the object
      this.on([object.resource, object.id, 'update'].join(":"), function(event, data) {
        object.serialize(data);

        object.trigger('sync');
      });

      var payload = {resource: object.resource, action: 'show', data: {id: object.id}};

      this.binding.send('resource_sync', payload);
    },

    persist: function(object, options) {
      var payload;
      // The action being used is based on the id of the object
      if(object.id) {
        payload = {resource: object.resource, action: 'update', id: object.id, data: object.toJSON()}
      } else {
        payload = {resource: object.resource, action: 'new', data: object.toJSON()}
      }

      this.binding.send('resource_sync', payload);
    },

    add: function(object, options) {
      this.persist(object, options);
    },

    update: function(object, options) {
      this.persist(object, options);
    },
  });
  _.extend(SocketStore.prototype, Frame.EventTarget);

  Frame.SocketStore = SocketStore;
});
