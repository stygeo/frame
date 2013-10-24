$(function() {

  var collection = Frame.Collection();

  collection
    .on('change', function(event) {
      console.log('change');
    })
    .on('reset', function(event) {
      console.log(event);
    });

  collection.push(1);
  collection.push(2);

  collection.reset([1,2,3,4]);

  var TestClass = function(collection) {
    this.collection = collection;
    var testSome = this;

    this.collection.on('change', function(some) {
      console.log('out of scope. I shouldn\'t get called.', some, this, testSome);
    });
  };

  var testClass = new TestClass(collection);
  testClass = undefined;

  collection.push(1);

  newTest("Collection removing / adding event listeners", function() {
    var cb1 = function() { return 1; };

    test('Removing all "test" events should empty it', function() {
      collection.on('test', function(){ console.log('test'); });
      collection.off('test');

      return collection.events('test').length === 0
    });

    test("Adding 2 callbacks to event 'test' should set the length to 2", function() {
      collection.on('test', cb1);
      collection.on('test', function() { return 2; });

      return collection.events('test').length === 2
    });

    test("Removing an unknown callback from the 'test' events should leave the length at 2", function() {
      collection.off('test', function() { return 1; });
      return collection.events('test').length === 2
    });


    test("Removing a known callback form the 'test' evets should set the length to 1", function() {
      collection.off('test', cb1);

      return collection.events('test').length === 1
    });

    test("Remove a known observer from the 'foobar' events should set the length to 0", function() {
      var observer = {
        foo: function(event) { console.log("Foo", event); },
        bar: function(event) { console.log("Bar", event); }
      };

      collection.on('foobar', observer.foo, observer);
      collection.on('foobar', observer.bar, observer);

      collection.off(observer, {all: true});

      return collection.events('foobar').length === 0;
    });

  });
});