$(function() {
  var Todo = Frame.Model.extend(['id', 'title'], {resource: 'todo'});

  var TodoItemView = Frame.View.extend({
    constructor: function(options) {
      Frame.View.call(this, options);

      this.todoItem = options.todoItem;
      this.todoItem.on('sync', _.bind(this.draw, this));
    },

    draw: function() {
      this.$.html(this.todoItem.title);
    },
  });

  var TodoController = Frame.ViewController.extend({
    constructor: function(options) {
      options = options || {};

      Frame.ViewController.call(this, options);

      this.socket = options.socket;

      var todo = new Todo({id: 1});
      todo.sync();

      this.todo = todo;
      window.todo = todo;
    },

    viewDidLoad: function() {
      var todoView = new TodoItemView({todoItem: this.todo});

      this.view.addSubview(todoView);
    },
  });

  Frame.application = Frame.Application.extend({
    didFinishLaunching: function() {
      var socket = new Frame.Socket("http://localhost:4567", {channels: ['todo']});

      var socketStore = new Frame.SocketStore(socket, {channel: 'todo'});

      socketStore.register(Todo);

      Frame.defaultStore = socketStore

      this.rootViewController = new TodoController({socket: socket});
    }
  });
});
