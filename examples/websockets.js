$(function() {
  jQuery.ajaxSetup({async: false});

  // Websockets
  function getSock() {
    return new Frame.Socket("http://localhost:4567");
  }

  describe("Initializing Frame's Websockets", function() {
    //it("should have a default channel", function() {
      //var sock = getSock();

      //return sock.defaultChannel !== undefined;
    //}),

    //it("should register new events", function() {
      //var passed = false;

      //var sock = getSock();

      //sock.on('message:new', function() {});

      //return sock.defaultChannel.events('message:new').length === 1;
    //});

    //it("should send data", function() {
      //var passed = false,
          //sock = getSock();

      //passed = sock.send('event', 'message');

      //return passed;
    //});

    //it("should handle incoming event", function() {
      //var passed = false,
          //sock = getSock();

      //sock.on('message:new', function(event, data) {
        //console.log('message:new', data)
      //});

      //sock.send('message:post', "PING");

      //return passed;
    //});

    //it("should broadcast messages", function() {
      //var sock = getSock();

      //return sock.broadcast("PING");
    //});

    //it("should hold channels as hash", function() {
      //var sock = getSock();

      //return typeof sock.channels === 'object';
    //});

    //it("should create channels on the fly", function() {
      //var sock = getSock();

      //return sock.channels['my channel'] === undefined && sock.channel('my channel') instanceof Frame.Socket.Channel;
    //});

    //it.skip("should be able to listen for incoming data on channels", function() {
      //var sock = getSock();

      //var channel = sock.channel('my channel');
      //channel.on('event', function() {});
      //channel.send('event', 'data');
      //channel.broadcast('data');
    //});
    //
    // Todo move this
    it("should test", function() {
      var Book = Frame.BasicObject.extend(['id', 'title']);

      var sock1 = getSock();
      var sock2 = getSock();

      sock1.on('connect', function() {});
      sock1.on('message', function(event, data) {
        console.log("Received '"+data+"' on default channel");
      });
      sock1.channel('student-1234').on('message', function(event, data) {
        // Implemented custom protocol
        if(data.action && data.resource) {
          // It was a resource
          switch(data.action) {
            case 'update':
              var klass = data.resource.singularize().camelCase();
              klass.trigger("update:"+data.data.id, data.data);
              break;
          }
        }
      });

      return true

    });
  });
});
