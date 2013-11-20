$(function() {
  describe("Frame.core", function() {
    var Book = Frame.BasicObject.extend({});

    describe("EventTarget", function() {
      var Eventer = function(){};
      _.extend(Eventer.prototype, Frame.EventTarget);
      var cb1 = function(){},
          eventer;

      beforeEach(function(){ eventer = new Eventer(); });

      it("should be able to extend to any given object", function() {
        expect(Eventer.prototype.on).not.toBeNull();
        expect(Eventer.prototype.off).not.toBeNull();
      });


      it("should remove all 'test' events when off is called", function() {
        eventer.on('test', cb1);
        eventer.off('test');

        expect(eventer.getEvent('test').length).toEqual(0);
      });

      it("should set the length to 2 when 2 callbacks to event 'test' are added", function() {
        eventer.on('test', cb1);
        eventer.on('test', function() { return 2; });

        expect(eventer.getEvent('test').length).toEqual(2);
      });

      it("should leave the 'test' event as it is when an unknown callback is removed", function() {
        eventer.on('test', cb1);
        eventer.off('test', function() { return 1; });

        expect(eventer.getEvent('test').length).toEqual(1);
      });


      it("should reduce the event listeners of event 'test' by 1 when a known callback is removed", function() {
        eventer.on('test', cb1);
        var length = eventer.getEvent('test').length;

        eventer.off('test', cb1);

        expect(eventer.getEvent('test').length).toEqual(length - 1);
      });

      it("should set the amount event listeners of event 'foobar' to 0 when specific observer is removed", function() {
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

        it("should fire the 'change' event everytime an attribute changes", function() {
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
        collection.callback = function(){};
        spyOn(collection, 'callback');

      });

      it('should behave as an array', function() {
        expect(collection instanceof Array).toBe(true);
      });

      it('should fire a change event when objects are added', function() {
        collection.on('change', collection.callback);
        collection.push(1);

        expect(collection.callback).toHaveBeenCalled();
      });

      it('should clear the collection of its content when reset is called', function(){
        var collection = new Frame.Collection(1,2,3);

        collection.reset();

        expect(collection.length).toEqual(0);
      });

      it('should call a callback for each element using "each"', function() {
        collection.reset([1,2,3]);

        collection.each(collection.callback);

        expect(collection.callback.calls.count()).toEqual(3);
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

    describe("Model", function() {
      var Book = Frame.Model.extend(['title']);
      var book;

      beforeEach(function(){
        book = new Book();
      });

      it("should flag attributes as dirty when assagigned", function() {
        book.title = 'Lord';
        expect(book.dirtyAttributes.indexOf('title') !== -1).toBe(true);
      });

      it('should reset the dirty attributes once persisted', function() {
        // Stub default store
        Frame.defaultStore = {add:function(){},update:function(){}};

        book.title = "Lord";
        expect(book.dirtyAttributes.indexOf('title') !== -1).toBe(true);
        book.save();

        expect(book.dirtyAttributes).toEqual([]);

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

  describe("Frame.rest", function() {
  });
});
