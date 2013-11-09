$(function() {
  function before() {
    window.Book = Frame.Model.extend(['id', 'title'], {resource: 'book'});

    window.socket = new Frame.Socket("http://localhost:4567");
    window.socketStore = new Frame.SocketStore(socket, {channel: 'student-1234'});
  }

  describe("Socket store", function() {
    it("should be able to register classes so it can bind callbacks", function() {
      before();

      socketStore.register(Book);

      return true;
    });

    it("should test", function() {
      var Book = Frame.Model.extend(['id', 'title'], {resource: 'book'});

      var socket = new Frame.Socket("http://localhost:4567");
      window.socket = socket;

      // Join own channel and students channel
      socket.channel('student-1234').channel('students');

      // Create new socket store and scope everything within the student's own channel
      var socketStore = new Frame.SocketStore(socket, {channel: 'student-1234'});

      // Register Book so it can take care of new instances created on the server
      socketStore.register(Book)

      Frame.defaultStore = socketStore

      var book = new Book({id: 1, title: 'my title'});
      window.book = book;

      book
        .on('title:change', function() {
          console.log("Book title after 'test_event' is fired:", this.title);
        })
        .on('sync', function() {
          // Triggered once the object has changed by the server
          console.log("sync");
        })
        // Establish a sync with the server. This means the object will be kept in sync at all times.
        // Something changes on the server it will be set client side and visa versa
        .sync();

      return true
    });
  });
});
