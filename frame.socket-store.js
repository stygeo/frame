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
      var binding;
      if(this.channelName) { binding = this.socket.channel(this.channelName); }
      else { this.socket; }

      this.socket.on('resource:store:modification', _.bind(this.processData, this));
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

          case 'update':
            this.trigger([data.resource.singularize(), data.data.id, 'update'].join(":"), data.data);
            break;
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
    },
  });
  _.extend(SocketStore.prototype, Frame.EventTarget);

  Frame.SocketStore = SocketStore;
});
