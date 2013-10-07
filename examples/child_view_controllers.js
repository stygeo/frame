$(function() {
  var ChildViewController = Frame.ViewController.extend({
    viewDidLoad: function() {
      this.view.$.html('Child view controller');
    },
  });

  var RootViewController = Frame.ViewController.extend({
    childContainer: undefined,

    viewDidLoad: function() {
      this.view.$.html('Root view controller');

      this.childContainer = new Frame.View();
      this.view.addSubview(this.childContainer);

      var childViewController = new ChildViewController();
      this.addChildViewController(childViewController);

      this.childContainer.addSubview(childViewController.view);
    },
  });

  Frame.application = Frame.Application.extend({
    didFinishLaunching: function() {
      this.rootViewController = new RootViewController();
    },
  });
});
