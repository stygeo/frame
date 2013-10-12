$(function() {
  var TodoItem = Frame.Model.extend({objectName: 'todo'});
  console.log(new TodoItem({title: 'test'}));
  var FuckItem = Frame.Model.extend({objectName: 'todo'});

  var TodoItemView = Frame.View.extend({
    element: 'li',

    constructor: function(options) {
      Frame.View.call(this, options);

      this.todoItem = options.todoItem;

      this.deleteButton = new Frame.Button({text: "Delete"});
      this.deleteButton.on('click', _.bind(this.deleteTodoItem, this));
    },

    draw: function() {
      this.$.html(this.todoItem.title);
      this.addSubview(this.deleteButton);
    },

    deleteTodoItem: function(e) {
      this.todoItem.destroy();

      this.removeFromSuperview();
    },
  });

  var NewTodoItemView = Frame.View.extend({
    delegate: undefined,

    events: {
      'click button' : 'addTodoItem'
    },

    draw: function() {
      this.$.html("<input type='text' placeholder='What would you like todo'><button>Add Todo</button>");
    },

    addTodoItem: function(ev) {
      var todoItem = new TodoItem({title: this.$.find('input').val()});

      var $this = this;
      todoItem.save({
        success: function(a,b,c) {
          $this.delegate.createdItem(todoItem);
        }
      });
    },
  });

  var TodoViewController = Frame.ViewController.extend({
    constructor: function(options) {
      Frame.ViewController.call(this, options);

      this.store = new Frame.IndexedStore();
      Frame.dataStore = this.store;
    },

    viewDidLoad: function() {
      var store = Frame.defaultStore,
          $this = this,
          newTodoItemView = new NewTodoItemView();

      newTodoItemView.delegate = this;

      this.view.addSubview(newTodoItemView);

      store.getAllByStoreName('todo', {
        success: function(data) {
          var todoItem = new TodoItem(data);
          var todoItemView = new TodoItemView({todoItem: todoItem, cssClass: 'ui list todo-item'});

          $this.view.addSubview(todoItemView);
        }
      })

      var todoItem = new TodoItem({id: 1});
      todoItem.fetch({}, {
        success: function(data, evt) {
        }
      });

      //TodoItem.find(1, {
        //success: function(item) {
          //console.log(item);
        //}
      //});

      //TodoItem.find({title: 'Test'}, {
        //success: function(items) {
          //console.log(items);
        //}
      //});
    },

    // Called by NewTodoItemView as delegate
    createdItem: function(todoItem) {
      var todoItemView = new TodoItemView({todoItem: todoItem, cssClass: 'ui list todo-item'});

      this.view.addSubview(todoItemView);
    },
  });

  /* Normally you'd place this else where */
  // Frame database configuration
  Frame.config.db = {
    type: 'Frame.IndexedStore',
    name: 'todo',
    version: 15,
    definition: {
      'todo': {
        keyPath: 'id', autoIncrement: true,
        indices: {title: false}
      },
    }
  };

  Frame.application = Frame.Application.extend({
    didFinishLaunching: function() {
      var todoController = new TodoViewController({el: "#todo"});
      this.rootViewController = todoController;
    }
  });
});
