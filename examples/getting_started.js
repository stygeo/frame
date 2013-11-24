$(function() {
  var DateViewController, DateView, DateModel;
  var NotificationCenter = Frame.NotificationCenter

  // Create the date model with a 'date' property
  DateModel = Frame.Model.extend(['date']);

  DateView = Frame.View.extend({
    events: {
      'click' : 'onClick'
    },
    onClick: function() {
      NotificationCenter.default.trigger('onclick:date', this.dateModel.date);
    },

    constructor: function() {
      // Call super's constructor
      Frame.View.call(this);

      // Create a new date model
      this.dateModel = new DateModel({date: new Date()});

      // Add an observer to the date field
      this.dateModel.on('date:changed', _.bind(this.update, this));
    },

    // Draw method
    draw: function() {
      // Set the date model's date as content
      this.$.html(this.dateModel.date);

      // Update the date (this invoke the observer)
      this.dateModel.date = new Date();
    },

    // Update method. Called from observer
    update: function() {
      var self = this;

      setTimeout(function() {
        self.draw();
      }, 1000);
    },
  });

  var RemoveMeView = Frame.View.extend({
    tag: 'input',
    constructor: function() {
      Frame.View.call(this);

      this.$.on('keypress', function() {
        console.log('keypress');
      });
    },

    wasRemovedFromSuperView: function() {
      console.log("Goodbye cruel world");
    }
  });

  var AttachingView = Frame.View.extend({
    events: {
      'mousemove' : 'draw',
      'click' : 'onclick'
    },

    draw: function(ev) {
      if(!ev) ev = {};

      var x = ev.clientX || 0, y = ev.clientY || 0;

      this.$.html("Put your cursor in me: "+x+":"+y);
    },

    onclick: function(ev) { alert('You clicked BasicObject#'+this.gid); },
  });

  DateViewController = Frame.ViewController.extend({
    // If you want the root view (this.view) to latch to any existing element
    // set the 'el' attribute from within the initialize method. It will be passed on to the view.
    // If no element with the specified attributes exists it creates a new DOM node.

    // Initialize is called from the constructor of the controller.
    constructor: function(options) {
      Frame.ViewController.call(this, options);

      // Set up anything controller related. Views can be set up from within the viewDidLoad method.
      this.router.route('/date/:action', this.addDate);
    },

    // Set up your view and load any content that needs to be displayed on the view.
    viewDidLoad: function() {
      NotificationCenter.default.on('onclick:date', this, function(event, data) {
        console.log(event, data);
      });

      var template = 'Hello world <div id="attachable"></div>';
      this.view.$.html(template);

      var dateView = new DateView();
      this.view.addSubview(dateView);

      var removeMeView = new RemoveMeView();
      this.view.addSubview(removeMeView);
      //removeMeView.removeFromSuperview();

      var attachingView = new AttachingView({el: '#attachable'});
      this.view.addSubview(attachingView);

      var cancelButton = new Frame.Button({text: "<- remove"});
      var _this = this;
      cancelButton.on('click', function() {
        removeMeView.removeFromSuperview();

        this.removeFromSuperview();

        NotificationCenter.default.off('onclick:date', _this);
      });
      this.view.addSubview(cancelButton);

      var helloButton = new Frame.Button({text: "Hello, press me."});
      helloButton.on('click', function() {
        alert("Oh, hello there, sir");
      });
      this.view.addSubview(helloButton);

      var addDateButton = new Frame.Button({text: "Add date"});
      addDateButton.on('click', function() { _this.router.go("/date/new"); });
      this.view.addSubview(addDateButton);
    },

    addDate: function(action) {
      switch(action) {
        case 'new':
          this.view.$.append($("<div/>").html("caught /date/:action route. With action being: "+action));
          break;
      }
    }
  });

  // Start point of your application. Setting 'Frame.application' fires up the application stack.
  Frame.application = Frame.Application.extend({
    didFinishLaunching: function() {
      // Method fired as soon as all javascript has been loaded and when the DOM is ready

      // Setup root view controller. All ViewControllers have a root view (controller.view) set.
      this.rootViewController = new DateViewController();

      // Once this function returns, if a rootViewController is present, it will call loadView on the root view controller
    },

    willTerminate: function() {
      // Called when the application terminates. (window close, navigation, etc.)
    }
  });
});
