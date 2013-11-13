$(function() {
  if(!('Frame' in window)) { throw new Error("Included frame.websockets but Frame is undefined"); }

  var Channel = undefined;

  var Type = {
    Disconnect: 0,
    Message: 1,
    Json: 2,
    Event: 3
  };
  function unpackMessage(data) {
    var payload = JSON.parse(data);

    return payload;
  }

  function packMessage(type, payload, channel) {
    return JSON.stringify({type: type, data: payload, channel: channel});
  }

  var Socket = Frame.BasicObject.extend({
    constructor: function(url, options) {
      if(!options) options = {};
      // Call super
      Frame.BasicObject.call(this);

      this.predefChannels = options.channels;

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

      this.performHandshake(url);
    },

    performHandshake: function(url) {
      // Create a url 'parser'
      var parser = document.createElement("a");
      parser.href = url;

      // Initialize handshake with host
      var _this = this;
      $.ajax({
        cache: false,
        url: url + "/websocket",
        success: function(data) {
          if(typeof data !== 'object') { data = JSON.parse(data); }

          _this.heartbeat = data.beat;
          _this.socketId = data.id;

          // Enforce ws:// for now
          var socketUrl = "ws://" + parser.hostname + (parser.port ? ":"+parser.port : "") + "/websocket/" + data.id;
          _this.createSocket(socketUrl);
        },
      }).fail(function(e) {
        throw new Error("Unable to perform handshake. Socket connection failed");
      });
    },

    createSocket: function(url) {
      // Append predefined channels to the url
      if(this.predefChannels) {
        url += "?"+ $.param({channels: this.predefChannels});
      }

      this.webSocket = new WebSocket(url);

      this.webSocket.onmessage = _.bind(function(event) {this.onMessage(event);}, this);

      this.webSocket.onopen = _.bind(function() {
        this.ready = true;

        // Handel all queued send calls that currently on hold.
        for(var i = 0; i < this.queuedData.length; i++) {
          this.deliver(this.queuedData[i]);
        }
      }, this);

      this.webSocket.onclose = function(e) {
        console.log("close", e);
      };

      this.webSocket.onerror = function(e) {
        console.log(e);
      }
    },

    onMessage: function(e) {
      var payload = unpackMessage(e.data);
      var event;

      switch(payload.type) {
        // Event handling
        case Type.Event:
          var pack = payload.data;
          event = {event: pack.name, data: pack.data};
          break;

        // Message handling
        case Type.Message:
          event = {event: 'message', data: payload.data}
          break;
      }

      this.handleEvent(event, payload.channel);
    },

    // Sending data
    deliver: function(data) {
      // Check for ready and queue if not ready.
      if(this.ready) {
        this.webSocket.send(data);
      } else {
        this.queuedData.push(data);
      }

      return true;
    },

    handleEvent: function(data, channel) {
      if(!channel) {
        this.defaultChannel.handleEvent(data);
      } else {
        this.channel(channel).handleEvent(data);
      }
    },

    // Create and return a new channel with the specified channel name
    // Channels are used to group certain events
    channel: function(channelName) {
      var channel = this.channels[channelName];
      if(channel === undefined) {
        channel = this.channels[channelName] = new Channel(channelName, this);

        this.deliver( packMessage(Type.Event, {name: 'subscribe', data: channelName}) );
      }

      return channel;
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
      console.log('depricated');
    },

    send: function(event, data /* TODO , replyCallback */) {
      //var type = (typeof data === 'object' ? Type.Json : Type.Message);

      this.socket.deliver( packMessage(Type.Event, {name: event, data: data}, this.name) );

      return true;
    },

    broadcast: function(data) {
      return true;
    },

    // The channel method on the channel objects allows us to chain.
    channel: function(channelName) {
      return this.socket.channel(channelName);
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
