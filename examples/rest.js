$(function() {
  function addToBody(str, object) {
    $("body").append( $("<div/>").html(str + " = " + JSON.stringify(object.toJSON()) ) );
  }

  Frame.defaultStore = new Frame.RestStore('http://localhost:4567', {key: 'id'});

  var Book = Frame.Model.extend({
    resource: 'books', // Might change back to objectName.
  });


  newTest("Interfacing with RestStore and option handling", function() {

    test('Testing synchronous rest', function() {
      var returned = false;
      var book = new Book({title: 'foo'})
      book.save({
        success: function() { returned = true; },
        async: false
      });

      return returned;
    });

    var book = new Book({id: 1});
    book.fetch({}, {
      success: function(data, textStatus, xhr) {
        //addToBody('fetch', this);
      }
    });

    book.destroy({
      success: function(data, textStatus, xhr) {
        //addToBody('destroy', this);
      }
    });

    var newBook = new Book({title: "Two towers", isbn: '12345'});
    newBook.save({
      success: function(data, textStatus, xhr) {
        //addToBody('save', this);
      }
    });

  });

  newTest("Restful collections", function() {

    // Specialized collections
    test('Specialized collection loading with success callback', function() {
      var BookCollection = Frame.Collection('/books');

      var success = false;
      var bookCollection = new BookCollection()
      bookCollection.fetch({
        success: function() {
          success = true;
        },
        async: false,
      });

      return success;
    });

    test('Specialized collection loading with "on" callback mechanism', function() {
      var BookCollection = Frame.Collection('/books');

      var success = false;
      var bookCollection = new BookCollection()
      bookCollection.fetch({
        success: function() {
          success = true;
        },
        async: false,
      });

      return success;
    });

    // Stand alone collections
    test('Collection loading from the model with success callback', function() {

      var success = false
      var bookCollection = Frame.Collection();
      Book.all(bookCollection, {
        success: function(collection) {
          success = bookCollection === collection;
        },
        async: false,
      });


      return success;
    });

    test('Collection loading from the model with "on" callback mechanism', function() {

      var success = false
      var bookCollection = Frame.Collection();
      bookCollection.on('reset', function(collection) {
        this === collection;
      });
      Book.all(bookCollection, {async: false});

      return success;
    });
  });
});
