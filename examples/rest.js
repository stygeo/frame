$(function() {
  Frame.defaultStore = new Frame.RestStore('http://localhost:4567', {key: 'id'});

  var Book = Frame.Model.extend({
    resource: 'books', // Might change back to objectName.
  });

  var book = new Book({id: 1});
  book.fetch({}, {
    success: function(data, textStatus, xhr) {
      console.log(this.title);
    }
  });
});
