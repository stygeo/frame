$(function() {
  function addToBody(str, object) {
    $("body").append( $("<div/>").html(str + " = " + JSON.stringify(object.toJSON()) ) );
  }

  Frame.defaultStore = new Frame.RestStore('http://localhost:4567', {key: 'id'});

  var Book = Frame.Model.extend({
    resource: 'books', // Might change back to objectName.
  });

  var book = new Book({id: 1});
  book.fetch({}, {
    success: function(data, textStatus, xhr) {
      addToBody('fetch', this);
    }
  });

  var newBook = new Book({title: "Two towers", isbn: '12345'});
  newBook.save({
    success: function(data, textStatus, xhr) {
      addToBody('save', this);
    }
  });
});
