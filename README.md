# frame.js

Frame is an extensive framework for the web written in JavaScript based on Objective-C
and Apple's UIKit framework. While not identical it's heavily inspired by Apple's API
design philosophy.

## Word of caution

Frame.js is still in heavy development and therefor it's recommended you
use frame for testing only. The documentation is ever changing and so
is the API. Please don't get frustrated or annoyed I'm still fiddling
with the overall API design. Please refer to the documentation (which
might be outdated!) or check out the samples (always up to date!).

Documentation / official page can be found at https://stygeo.github.io/frame

## CODE PLOX

If you like sample code here's a very basic sample application in
frame.js which should give you a rough impression.

### View controller

```javascript
var MyView = Frame.View.extend({
  // Define a custom draw method
  draw: function() {
    this.$.html("Hello world");
  }
});

// Define the view controller
var ExampleViewController = new Frame.ViewController({
  viewDidLoad: function() {
    // Add subviews, events, etc.
    var myView = new MyView();
    this.view.addSubview(myView);
  }
});

Frame.application = Frame.Application.extend({
  didFinishLaunching: function() {
    this.rootViewController = new ExampleViewController();
  }
});
```

### Data with WebSocket Store (WIP, sample)
```javascript
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
```

### Data with REST Data Store

#### Fetch

```javascript
// Set the default store to a new rest store
Frame.defaultStore = new Frame.RestStore('http://localhost');

// Book resource / model
var Book = Frame.Model.extend({resource: 'books'});

// Fetch a resource
var book = new Book({id: 1});
book.fetch({}, {
  success: function(data, textStatus, xhr) {
    console.log(this);
  }
});
```

#### Save

```javascript
var newBook = new Book({title: "Two towers", isbn: '12345'});
newBook.save({
  success: function(data, textStatus, xhr) {
    console.log(this);
  }
});
```

#### list

```javascript
// Lists requires frame's collection
var collection = new Frame(); // new Frame() is shorthand for new Frame.Collection()
collection.on('reset', function() {
  console.log("Fetched");
});
Book.all(collection);
```

The above could also have been written as

```javascript
var collection = new Frame();
Book.all(collection, {
  success: function() {
    console.log("Fetched"); 
  }
});
```
