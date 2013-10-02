$(function() {
  // Define out store
  Frame.storeDefinition = [{storeName: 'todo'}];

  var TodoItem = Frame.Model.extend(['title'], {
    objectName: 'todo'
  });

  var store = new Frame.IndexedStore();
  Frame.dataStore = store;

  // Open todo database
  store.open('todo', function() {

    var todoItem = new TodoItem({title: "Todo item for " + new Date().getTime()});

    todoItem.save([], {
      success: function(a,b,c) {
        console.log(a,b,c);

        store.getAllByStoreName('todo', function(data) {
          console.log(data);
        });

      }
    });
  });
});
