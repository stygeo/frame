$(function() {
  function addToBody(str, object) {
    $("body").append( $("<div/>").html(str + " = " + JSON.stringify(object.toJSON()) ) );
  }

  Frame.defaultStore = new Frame.RestStore('http://localhost:4567', {key: 'id'});

  var Book = Frame.Model.extend({
    resource: 'books', // Might change back to objectName.
  });
  window.Book = Book


  newTest("Interfacing with RestStore and option handling", function() {

    test('Synchronous rest', function() {
      var returned = false;
      var book = new Book({title: 'foo'})
      book.save({
        success: function() { returned = true; },
        async: false
      });

      return returned;
    });

    test('Fetching 2 resources with different names', function() {
      var first = new Book({id: 1});
      first.fetch({}, {async: false, success: function(){
        console.log(this);
      }});

      var second = new Book({id: 2});
      second.fetch({}, {async: false});

      return second.title !== first.title
    });

    //var book = new Book({id: 1});
    //book.fetch({}, {
      //success: function(data, textStatus, xhr) {
        //addToBody('fetch', this);
      //}
    //});

    //book.destroy({
      //success: function(data, textStatus, xhr) {
        //addToBody('destroy', this);
      //}
    //});

    //var newBook = new Book({title: "Two towers", isbn: '12345'});
    //newBook.save({
      //success: function(data, textStatus, xhr) {
        //addToBody('save', this);
      //}
    //});

  });

  newTest("Restful collections", function() {

    test('Collection loading from the model with success callback', function() {
      var success = false
      var bookCollection = Frame.Collection();
      Book.all(bookCollection, {
        success: function(collection) {
          success = bookCollection === collection;
        },
        async: false,
      });
      collection = bookCollection;

      return success;
    });

    test('Collection loading from the model with "on" callback mechanism', function() {
      var success = false
      var bookCollection = Frame.Collection();

      bookCollection.on('reset', function(collection) {
        success = bookCollection === collection;
      });
      Book.all(bookCollection, {async: false});

      return success;
    });

  });


});
