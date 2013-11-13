$(function(){
  describe("Handling URL", function(){
    it("should have a navigation function which changes the url without navigation" ,function() {
      var router = new Frame.Router();
      router.go("/bar/foo/baz");

      return window.location.pathname = '/bar/foo/baz';
    });

    it("should return the current path", function() {
      var router = new Frame.Router();

      router.go("/route");

      return router.hash() === '/route';
    });

    it("should be possible to register routes", function() {
      var router = new Frame.Router();
      router.route('/route', function() {
      });

      return true;
    });

    it("should create a regexp out of a static route", function() {
      var router = new Frame.Router(),
          matcher = router.generateMatcher("/my/route");

      return matcher.regexp.test("/my/route");
    });

    it("should create a regexp out of a variable route", function() {
      var router = new Frame.Router(),
          matcher = router.generateMatcher("/my/:route"),
          regexp = matcher.regexp

      return regexp.test("/my/route") && regexp.test("/my/otherroute");
    });

    it("should call a callback for the initial route once it's added",  function() {
      var passed = false;
      var router = new Frame.Router();

      router.go("/foo/baz");
      router.route("/foo/:bar", function(bar) {
        passed = true
      });

      return passed;

    });

    it("should call a callback if it matches a static route", function() {
      var passed = false;
      var router = new Frame.Router();

      router.go("/my/route");
      router.route("/my/route", function() {
        passed = true
      });

      return passed;
    });

    it("should call a callback if it matches a variable route", function() {
      var passed = false;
      var router = new Frame.Router();

      router.go("/foo/baz");
      router.route("/foo/:bar", function(bar) {
        passed = bar === 'baz';
      });

      return passed;
    });

    it("should call a callback if it matches a multi-variable route", function() {
      var passed = false;
      var router = new Frame.Router();

      router.go("/foo/baz/bar");
      router.route("/foo/:bar/:baz", function(bar, baz) {
        passed = bar === 'baz' && baz === 'bar'
      });

      return passed;
    });

    it("should be possible to disable routes", function() {
      var passed = true;
      var router = new Frame.Router();

      router.route("/bar", function() {passed = false;});
      router.disable();

      router.go("/bar");

      return passed;
    });

    it("should be possible to remove all routes and disable the router", function() {
      var passed = true;
      var router = new Frame.Router();

      router.route("/baz", function() {passed = false;});
      router.removeAllRoutes();

      router.go("/baz");

      return passed;
    });

    it("should have a router on each view controller", function() {
      var controller = new Frame.ViewController();

      return controller.router !== undefined;
    });

  });
});

