$(function() {
  var DateViewController, DateView;

  DateView = Frame.View.extend({
    constructor: function() {
      // Call super's constructor
      Frame.View.call(this);

      // Create a new date model
      this.dateModel = new Frame.Model({date: new Date()});

      // Add an observer to the date field
      this.dateModel.addObserverForKey('date', _.bind(this.update, this));
    },

    // Draw method
    draw: function() {
      // Set the date model's date as content
      this.$.html(this.dateModel.date);

      // Update the date (this invoke the observer)
      this.dateModel.date = new Date();
    },

    // Update method. Called from addObserverForKey
    update: function() {
      var self = this;

      setTimeout(function() {
        self.draw();
      }, 1000);
    },
  });

  DateViewController = Frame.ViewController.extend({
    // If you want the root view (this.view) to latch to any existing element
    // set the 'el' attribute from within the initialize method. It will be passed on to the view.
    // If no element with the specified attributes exists it creates a new DOM node.

    // Initialize is called from the constructor of the controller.
    constructor: function(options) {
      Frame.ViewController.call(this, options);

      // Set up anything controller related. Views can be set up from within the viewDidLoad method.
    },

    // Set up your view and load any content that needs to be displayed on the view.
    viewDidLoad: function() {
      this.view.$.html('Hello world');

      this.subview = new DateView();
      this.view.addSubview(this.subview);
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
      console.log("willTerminate");
    }
  });
});
