$(function() {
  describe("Frame", function() {
    var Book = Frame.BasicObject.extend({});

    describe("EventTarget", function() {
      it("should be able to extend to any given object", function() {
        var Eventer = function(){};
        _.extend(Eventer.prototype, Frame.EventTarget);

        expect(Eventer.prototype.on).not.toBeNull();
        expect(Eventer.prototype.off).not.toBeNull();
      });

      describe("removing and adding event listeners", function() {
        var Eventer = function(){};
        _.extend(Eventer.prototype, Frame.EventTarget);
        var cb1 = function(){};
        var eventer;
        beforeEach(function(){ eventer = new Eventer(); });

        it("removing all 'test' events should empty it", function() {
          eventer.on('test', cb1);
          eventer.off('test');

          expect(eventer.events('test').length).toEqual(0);
        });

        it("Adding 2 callbacks to event 'test' should set the length to 2", function() {
          eventer.on('test', cb1);
          eventer.on('test', function() { return 2; });

          expect(eventer.events('test').length).toEqual(2);
        });

        it("Removing an unknown callback from the 'test' events should leave it as it is", function() {
          eventer.on('test', cb1);
          eventer.off('test', function() { return 1; });

          expect(eventer.events('test').length).toEqual(1);
        });


        it("Removing a known callback form the 'test' events reduce it by 1", function() {
          eventer.on('test', cb1);
          var length = eventer.events('test').length;

          eventer.off('test', cb1);

          expect(eventer.events('test').length).toEqual(length - 1);
        });

        it("Remove a known observer from the 'foobar' events should set the length to 0", function() {
          var observer = {
            foo: function(event) { console.log("Foo", event); },
            bar: function(event) { console.log("Bar", event); }
          };

          eventer.on('foobar', observer.foo, observer);
          eventer.on('foobar', observer.bar, observer);

          eventer.off(observer, {all: true});

          expect(eventer.events('foobar').length).toEqual(0);
        });
      });
    });

    describe("BasicObject", function() {
      describe("properties", function() {
        Book.property('title');

        beforeEach(function() {book = new Book({title: 'Foo'});});

        it("should serialize attributes upon passing it to the constructor", function() {
          expect(book.title).not.toBeNull()
        });
      });

      describe("observer pattern", function() {
        beforeEach(function() {
          book = new Book();
          book.callback = function(){};
          spyOn(book, 'callback');
        });

        it("should fire a 'new' event when a attribute is set for the first time", function() {
          book.on('title:new',  book.callback);
          book.title = 'Some title';

          expect(book.callback).toHaveBeenCalled();
        });

        it("should fire the 'new' callback only once", function() {
          expect(book.callback.calls.count()).toEqual(0);

          book.on('title:new',  book.callback);
          book.title = 'Some title';
          book.title = 'Other title';

          expect(book.callback.calls.count()).toEqual(1);
        });

        it("should fire the 'change' event when a title changed", function() {
          book.on('title:change',  book.callback);
          book.title = 'Some title';
          book.title = 'Other title';

          expect(book.callback.calls.count()).toEqual(2);
        });
      });
    });

    describe("Collection", function() {
      var collection;
      beforeEach(function() {
        collection = new Frame.Collection();
      });

      describe("initialization", function() {
        it('should tread optional arguments as array', function() {
          var c = new Frame.Collection(1,2);

          expect(c.length).toEqual(2);
        });

        it('should accept an array and concatinate it', function() {
          var c = new Frame.Collection([1,2]);

          expect(c.length).toEqual(2);
        });
      });
    });

    describe("Routing", function() {
      var router,
      // Frame has it's own push state handler, calling the originalPushState eventually.
      // Since I don't want to change the actual URL I've stubbed the 'original' one.
          pushState = window.history.originalPushState;

      beforeEach(function(){
        router = new Frame.Router();
        router.callback = function(){};
        spyOn(router, 'callback');
        window.history.originalPushState = function(){};
      });
      afterEach(function(done){
        setTimeout(function() {
          window.history.originalPushState = pushState;

          done();
        }, 1);
      });

      it("should have a navigation function which fires a 'pushstate' event", function(done) {
        $(window).on('pushstate', router.callback);

        router.go("/bar/foo/baz");

        expect(router.callback).toHaveBeenCalled();

        done();
      });

      it("should return the current path", function() {
        stubRouteAndGo(router, '/route');

        expect(router.hash()).toEqual('/route');
      });

      it("should create a regexp out of a static route", function() {
        matcher = router.generateMatcher("/my/route");

        expect(matcher.regexp.test("/my/route")).toBe(true);
      });

      it("should create a regexp out of a variable route", function() {
        matcher = router.generateMatcher("/my/:route"),
        regexp = matcher.regexp

        expect(regexp.test("/my/route")).toBe(true);
        expect(regexp.test("/my/otherroute")).toBe(true);
      });

      function stubRouteAndGo(router, path) {
        spyOn(router, 'getPathName').and.returnValue(path);
        router.go(path);
      }

      it("should call a callback for the initial route once it's added",  function() {
        stubRouteAndGo(router, '/foo/baz');

        router.route("/foo/:bar", router.callback);

        expect(router.callback).toHaveBeenCalled();
      });

      it("should call a callback if it matches a static route", function() {
        stubRouteAndGo(router, '/my/route');

        router.route("/my/route", router.callback);

        expect(router.callback).toHaveBeenCalled();
      });

      it("should call a callback if it matches a variable route", function() {
        stubRouteAndGo(router, '/foo/baz');

        router.route("/foo/:bar", router.callback);

        expect(router.callback).toHaveBeenCalled();
      });

      it("should call a callback if it matches a multi-variable route and set the correct variables", function() {
        stubRouteAndGo(router, "/foo/baz/bar");

        router.route("/foo/:bar/:baz", function(bar, baz) {
          expect(bar).toEqual('baz');
          expect(baz).toEqual('bar');
        });

      });

      it("should be possible to disable routes", function() {
        spyOn(router, 'getPathName').and.returnValue('/bar');

        router.disable();

        router.route("/bar", router.callback);

        router.go("/bar");

        expect(router.callback).not.toHaveBeenCalled();
      });

      it("should be possible to remove all routes and disable the router", function() {
        spyOn(router, 'getPathName').and.returnValue('/bar');

        router.route("/baz", router.callback);
        router.removeAllRoutes();

        router.go("/baz");

        expect(router.callback).not.toHaveBeenCalled();
      });
    });
  });
});
