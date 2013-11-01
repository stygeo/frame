// Please note that unless you disable Chrome's "Access-Control-Allow-Origin" setting this sample won't run.
// Either disable it temporarily or use Safari (7.0+)

$(function() {

  Frame.defaultStore = new Frame.RestStore('http://localhost:4567', {key: 'id'});

  var Book = Frame.Model.extend({
    resource: 'books', // Might change back to objectName.
  });

  // All test runs synchronously for testing purposes.
  describe("Interfacing with RestStore and option handling", function() {

    it('should do synchronous rest', function() {
      var returned = false;
      var book = new Book({title: 'foo'})
      book.save({
        success: function() { returned = true; },
        async: false
      });

      return returned;
    });

    it('should save objects and have an id', function() {
      var passed = false;
      var book = new Book({title: "bar"});
      book.save({async: false});

      return book.id !== undefined;
    });

    it('should fetch 2 resources and have different names', function() {
      var first = new Book({id: 1});
      first.fetch({}, {async: false});

      var second = new Book({id: 2});
      second.fetch({}, {async: false});

      return second.title !== first.title
    });

    it('should destroy a resource', function() {
      var passed = false;
      var book = new Book({id: 1});
      book.fetch({}, {
        success: function() {
          this.destroy({
            success: function() {
              var t = new Book({id: 1});
              t.fetch({}, {
                success: function() {
                  passed = true
                },
                async: false
              });
            },
            async: false
          });
        },
        async: false
      });

      return passed;
    });

    it('should update an object', function() {
      var passed = false;
      var book = new Book({id:1});
      book.fetch({},{async: false});

      book.title = "Updated title";
      book.save({async: false, 
                success: function() {
                  passed = this.title === "Updated title"; 
                }
      });

      return passed;
    });
  });

  describe("Restful collections", function() {

    it('should load a resource and add entries to a collection', function() {
      var success = false
      var bookCollection = new Frame.Collection();
      Book.all(bookCollection, {
        success: function(collection) {
          success = bookCollection === collection;
        },
        async: false,
      });
      collection = bookCollection;

      return success;
    });

    it('should reset the collection', function() {
      var success = false
      var bookCollection = new Frame.Collection();

      bookCollection.on('reset', function(collection) {
        success = bookCollection === collection;
      });
      Book.all(bookCollection, {async: false});

      return success;
    });

  });
});
