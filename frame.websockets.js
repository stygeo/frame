$(function() {
  if(!('Frame' in window)) { throw new Error("Included frame.websockets but Frame is undefined"); }

  var Channel = undefined;

  var Socket = Frame.BasicObject.extend({
    constructor: function(url, options) {
      if(!options) options = {};
      // Call super
      Frame.BasicObject.call(this);

      // Indicator whether the socket is ready (for sending data).
      this.ready = false;
      // Queued data for sending if the connection isn't ready (yet).
      this.queuedData = [];

      // Channels being managed
      this.channels = {};

      // Default channel (or no channeled subscriptions)
      this.defaultChannel = new Channel(null, this);

      // Check if sockets are supported and throw an error if it isn't.
      if(!('WebSocket' in window)) { throw new Error("WebSockets not supported by browser"); }

      this.webSocket = new WebSocket(url, options.protocols);

      this.webSocket.onmessage = _.bind(function(event) {
        this.handleEvent(event);
      }, this);

      this.webSocket.onopen = _.bind(function() {
        this.ready = true;

        // Handel all queued send calls that currently on hold.
        for(var i = 0; i < this.queuedData.length; i++) {
          this._send(this.queuedData[i]);
        }
      }, this);

      this.webSocket.onclose = function(e) {
        console.log("close", e);
      };
    },

    // Sending data
    _send: function(data) {
      // Check for ready and queue if not ready.
      if(this.ready) {
        this.webSocket.send(data);
      } else {
        this.queuedData.push(data);
      }

      return true;
    },

    handleEvent: function(payload) {
      var data = JSON.parse(payload);
      if(data.channel === undefined) {
        this.defaultChannel.handleEvent(data);
      } else {
        this.channel(data.channel).handleEvent(data);
      }
    },

    // Create and return a new channel with the specified channel name
    // Channels are used to group certain events
    channel: function(channelName) {
      return this.channels[channelName] || (this.channels[channelName] = new Channel(channelName, this));
    },

    // Substitutes
    send: function() {
      return this.defaultChannel.send.apply(this.defaultChannel, Array.prototype.slice.call(arguments, 0));
    },
    broadcast: function() {
      return this.defaultChannel.broadcast.apply(this.defaultChannel, Array.prototype.slice.call(arguments, 0));
    },
    on: function() {
      return this.defaultChannel.on.apply(this.defaultChannel, Array.prototype.slice.call(arguments, 0));
    },
    off: function() {
      return this.defaultChannel.off.apply(this.defaultChannel, Array.prototype.slice.call(arguments, 0));
    },
    trigger: function() {
      return this.defaultChannel.trigger.apply(this.defaultChannel, Array.prototype.slice.call(arguments, 0));
    },
  });

  Channel = Frame.BasicObject.extend({
    constructor: function(channelName, socket, options) {
      Frame.BasicObject.call(this, options);

      this.name = channelName;
      this.socket = socket;
    },

    // Main event handler
    handleEvent: function(e) {
      var type = e.event,
          userData = e.data

      if(type !== undefined) {
        this.trigger(type, userData);
      } else {
        this.trigger('message', userData);
      }
    },

    _send: function(data) {
      if(typeof data === 'object') data = JSON.stringify(data);

      this.socket._send(data);
    },

    // Sending data
    send: function(event, data /* TODO , replyCallback */) {
      var payload = {event: event, data: data, channel: this.name};

      this._send(payload);

      return true;
    },

    // Broad cast a message without any event attached
    broadcast: function(data) {
      var payload = {data: data, channel: this.name};

      this._send(payload);

      return true;
    },
  });
  _.extend(Channel.prototype, Frame.EventTarget);

  Frame.Socket = Socket;
  Frame.Socket.Channel = Channel;

  // Register AMD module.
  if(typeof define === "function" && define.amd) {
    define("frame.websockets", [], function() { return Frame; });
  }
});
