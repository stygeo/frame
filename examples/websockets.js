$(function() {
  jQuery.ajaxSetup({async: false});

  describe("Initializing Frame's Websockets", function() {
    it("should have a default channel", function() {
      var sock = getSock();

      return sock.defaultChannel !== undefined;
    }),

    it("should register new events", function() {
      var passed = false;

      var sock = getSock();

      sock.on('message:new', function() {});

      return sock.defaultChannel.events('message:new').length === 1;
    });

    it("should send data", function() {
      var passed = false,
          sock = getSock();

      passed = sock.send('event', 'message');

      return passed;
    });

    it("should handle incoming event", function() {
      var passed = false,
          sock = getSock();

      sock.on('message:new', function(event, data) {
        console.log('message:new', data)
      });

      sock.send('message:post', "PING");

      return passed;
    });

    it("should broadcast messages", function() {
      var sock = getSock();

      return sock.broadcast("PING");
    });

    it("should hold channels as hash", function() {
      var sock = getSock();

      return typeof sock.channels === 'object';
    });

    it("should create channels on the fly", function() {
      var sock = getSock();

      return sock.channels['my channel'] === undefined && sock.channel('my channel') instanceof Frame.Socket.Channel;
    });

    it.skip("should be able to listen for incoming data on channels", function() {
      var sock = getSock();

      var channel = sock.channel('my channel');
      channel.on('event', function() {});
      channel.send('event', 'data');
      channel.broadcast('data');
    });
  });
});
