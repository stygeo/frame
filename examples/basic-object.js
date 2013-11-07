$(function() {
  var Book = Frame.BasicObject.extend({});
  Book.property('title');

  describe("BasicObject observer pattern", function() {
    it("should fire a 'new' event when a attribute is set for the first time", function() {
      var passed = false;

      var book = new Book();
      book.on('title:new',  function() {
        passed = true;
      });
      book.title = 'Some title';

      return passed;
    });

    it("should fire the 'new' callback only once", function() {
      var amount = 0;

      var book = new Book();
      book.on('title:new',  function() {
        amount++;
      });
      book.title = 'Some title';
      book.title = 'Other title';

      return amount === 1;
    });

    it("should fire the 'change' event when a title changed", function() {
      var passed = false;
      var book = new Book();
      book.on('title:changed',  function() {
        passed = true;
      });
      book.title = 'Some title';
      book.title = 'Other title';

      return passed;
    });
  });
});
