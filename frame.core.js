$(function() {
  var Frame = {};
  // Helper methods
  var __emptyHash = {}, __has, __extend, __currentGID = 0,
  __has = function(object, property) { return __emptyHash.hasOwnProperty.call(object, property); },
  __keys = function(object) {
    var keys = []
    for(var k in object) {
      if(object.hasOwnProperty(k)) {
        keys.push(k);
      }
    }
    return keys;
  },
  __merge = function(hash, otherHash) {
    for (var key in otherHash) {
      if (__has(otherHash, key) && !__has(hash, key)) {
        hash[key] = otherHash[key];
      }
    }
  },
  __makeArray = function(object) {
    if( !(object instanceof Array) ) {
      object = [object];
    }
    return object;
  },
  __isBasicObject = function(object) {
    return __has(object, 'basicObjectDefined');
  },
  __isString = function(object) {
    return typeof(object) == "string";
  },
  // Returns a new GID with the given prefix. GIDs are always returned as string
  __gid = function(prefix) {
    var GID = (++__currentGID).toString();
    if(prefix) {
      GID = prefex+"-"+GID;
    }

    return GID;
  }

  // Creates a shared instance method
  function createDefaultInstanceMethodOn(object) {
    Object.defineProperty(object, 'default', {
      get: function() {
        if(!this.__sharedInstance) { this.__sharedInstance = new object(); }
        return this.__sharedInstance;
      },
      set: function(){}
    });
  }

  __extend = function(propertiesOrProtoProps, protoProps) {
    var parent = this;
    var child, properties;
    if(propertiesOrProtoProps instanceof Array) {
      properties = properties;
    } else {
      protoProps = propertiesOrProtoProps;
    }

    if (protoProps && __has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function() { this.constructor = child; };

    Surrogate.prototype = parent.prototype;
    // Copy over static methods
    child.prototype = new Surrogate;
    child.prototype.Class = child;

    if (protoProps) _.extend(child.prototype, protoProps);

    // Copy over static methods
    for (var key in parent) {
      if (__has(parent, key)) {
        child[key] = parent[key];
      }
    }

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;
    // Set the properties on the object if any was given
    if(properties) {
      child.property(properties);
    }

    return child;
  };

  var Construct = function(){};
  Construct.extend = __extend;

  // Basic low level object. Contains most low level object functions such as KVO & KVC.
  var BasicObject = Construct.extend({
    constructor: function(options) {
      /* These values are not meant to be KVO. */
      // Determines whether this object is a basic object so you can distinguish them from regular objects.
     // this.basicObjectDefined=true
      // The current id of the object
      this.gid = __gid();
    },

    properties: function() {
      return this._properties || (this._properties = {})
    },

    observers: function() {
      return this._observers || (this._observers = {})
    },

    // Specialized setter. Calls callbacks on observed values
    setProperty: function(key, value) {
      this.properties()[key] = value

      if(this.observers[key] && this.observers[key].length > 0) {
        for(var i = 0; i < this.observers[key].length; i++) {
          var observer = this.observers[key][i]
          if(observer !== undefined) {
            // Signal the observer or call the callback
            if($.isFunction(observer)) {
              observer.call(this, key, value);
            } else {
              observer.observeValueForKey.call(observer, key, value)
            }
          }
        }
      }
    },

    // Basic object getter
    getProperty: function(key) {
      return this.properties()[key]
    },

    // Returns the given or sets the given key with value (Key Value Coding, KVC)
    valueForKey: function(value_or_key, key) {
      if(key === undefined) {
        return this.getProperty(value_or_key)
      }

      this.setProperty(key, value_or_key)
    },

    // Observe the given key. (Key Value Observing, KVO)
    addObserverForKey: function(observerOrKey, keyOrCallback, options) {
      var observer, key;
      if(__isString(observerOrKey) && $.isFunction(keyOrCallback)) {
        observer = keyOrCallback;
        key = observerOrKey;
      } else {
        observer = observerOrKey;
        key = keyOrCallback;
      }

      if(this.observers[key] === undefined) {
        this.observers[key] = []
      }

      this.observers[key].push(observer)
    },

    // Remove the given observer with the specified key
    removeObserverForKey: function(observer, key) {
      if(this.observers[key]) {
        for(var i = 0; i < this.observers[key].length; i++) {
          if(this.observers[key][i] === observer) {
            delete this.observers[key][i]
            break
          }
        }
      }
    },

    isKindOfClass: function(klass) {
      return this.Class == klass;
    },
  });

  // Public property setter. Creates specialized properties which can be accessed through KVC and make use of KVO
  BasicObject.property = function(propertyNames) {
    propertyNames = __makeArray(propertyNames);

    for(var i = 0; i < propertyNames.length; i++) {
      var propertyName = propertyNames[i];

      if( !(propertyNames in this.prototype) ) {
        Object.defineProperty(this.prototype, propertyName, {
          enumerable: true,
          get: function() {
            return this.getProperty(propertyName)
          },
          set: function(value) {
            this.setProperty(propertyName, value)
          }
        });
      }
    }
  }


  /*
   * Frame.Model data object.
   */
  // The basic model. Inherit from this object.
  var Model = BasicObject.extend({
    constructor: function(attributes, options) {
      // Call the basic object's constructor.
      BasicObject.call(this, options);

      // Define this as a new model.
      this.isNew = true;

      // Serialize the attributes
      this.serialize(attributes);

    },

    fetch: function(parameters, options) {
      if(!options) options = {};

      Frame.defaultStore.fetch(this, parameters, options);
    },

    save: function(parameters, options) {
      if(!options) options = {};

      if(this.isNew) {
        Frame.defaultStore.add(this, options);
      } else {
        // TODO
      }
    },

    destroy: function(options) {
      Frame.defaultStore.destroy(this, options);
    },

    serialize: function(serializableAttributes) {
      // Get the current object's constructor so we can bind values to it.
      var objectClass = this.constructor;

      // Iterate over the retrieved attributes
      for(var key in serializableAttributes) {
        if(!(key in objectClass)) {
          // Model attributes are 'lazily' added.
          objectClass.property(key);
        }
        // Assign the attributes value
        this.valueForKey(serializableAttributes[key], key);
      }
    },

    // Copies the attributes of the model to a new object.
    toJSON: function() {
      var attributes = {};

      for(var k in this.properties()) {
        if(this.properties().hasOwnProperty(k)) {
          attributes[k] = this.valueForKey(k);
        }
      }

      return attributes;
    },

    // Validates the model (not the model's fields), such as URL.
    // TODO move this to the datastore instead
    __validateModel: function(){
      if(!this.url) throw "No URL specified for model";
    },
  });
  Model.find = function(idOrQuery, options) {
    Frame.defaultStore.find(this, idOrQuery, options);
  };

  /*
   * Views
   */

  /*
   * Basic view
   */
  function splitEventSelector(selectorEvent) {
    var s = {};
    if(selectorEvent.indexOf(' ') != -1) {
      s.event = selectorEvent.substr(0, selectorEvent.indexOf(' ')),
      s.selector = selectorEvent.substr(selectorEvent.indexOf(' ')+1)
    } else {
      s.event = selectorEvent;
    }

    return s;
  }

  var View = BasicObject.extend({
    subviews: [],
    element: 'div',

    // Basic view contstructor
    constructor: function(options) {
      if(!options) options = {};

      // Call the basic object's constructor.
      BasicObject.call(this, options);

      // Set the element of the controller
      this.el = options.el;
      // Set the CSS classes
      this.cssClass = options.cssClass;

      // Loop through the events if specified
      if(this.events) {
        for(var key in this.events) {
          if(this.events.hasOwnProperty(key)) {
            // Bind the event to the view (including any sub-queries)
            // this.events[key] returns a function 'pointer' (key)
            this.on(key, this[this.events[key]]);
          }
        }
      }
    },

    // Add a subview to the current view. Takes care of drawing the view.
    addSubview: function(subview, options) {
      // Add the subview to this view
      this.subviews.push(subview);

      // Set this as the super view.
      subview.superView = this;

      // Draw the view
      subview.draw();

      // If the subview's el is present it latched on to something.
      if(!subview.el) {
        this.$.append(subview.$);
      }
    },

    // Remove given view from this view. Takes care of unbinding
    removeSubview: function(subview) {
      // Get the index of the current view
      var idx = this.subviews.indexOf(subview);
      if(idx !== -1) {
        var subview = this.subviews[idx];
        delete this.subviews[idx];

        subview.wasRemovedFromSuperView();
      }
    },

    // Easy function to remove a view of a super view
    removeFromSuperview: function() {
      if(this.superView) {
        this.superView.removeSubview(this);
      }
    },

    // On DOM event. Uses basic jQuery event handling.
    on: function(event, cb) {
      // Try and split events such as 'click #selector' and perform any find queries necessary.
      var eventSelector = splitEventSelector(event);
      var callback = _.bind(cb, this);
      if(eventSelector.selector) {
        this.$.on(eventSelector.event, eventSelector.selector, callback);

      } else {
        this.$.on(eventSelector.event, callback);
      }
    },

    // Remove DOM event.
    off: function(event, cb) {
      // Try and split events such as 'click #selector' and perform any find queries necessary.
      var eventSelector = splitEventSelector(event);
      var callback = _.bind(cb, this);
      if(eventSelector.selector) {
        this.$.find(eventSelector.selector).off(eventSelector.event, callback);
      } else {
        this.$.off(eventSelector.event, callback);
      }
    },

    // Function will be called when the view has been removed from the super view.
    wasRemovedFromSuperView: function() {
      // Remove from DOM
      this.$.remove();
    },

    // Basic draw method. Should be overwritten for custom drawing
    draw: function() {},
  });
  // Generic accessor for the view's element (either created or 'fetched').
  Object.defineProperty(View.prototype, "$", {
    enumerable: true,

    get: function() {
      // Get the bound element or create a new element.
      var element = this.el || '<'+this.element+'/>';

      if(!this.__collection) {
        this.__collection = $(element);
        // Add classes set this view cssClass attribute.
        this.__collection.addClass(this.cssClass);
      }

      return this.__collection;
    }
  });

  /*
   * Canvas view.
   */
  var CanvasView = View.extend({
    // Create a canvas element if no element is given
    element: 'canvas',

    constructor: function(options) {
      if(!options) options = {};

      // Call the super view's constructor
      View.call(this, options);

      this.$.attr({width: options.width, height: options.height});
      this.context = this.$[0].getContext('2d');
    }
  });

  // Generic button view
  var Button = View.extend({
    element: 'button',

    constructor: function(options) {
      if(!options) options = {};

      View.call(this, options);

      // Initialize default text
      if('text' in options) this.text(options.text);
    },

    // Convenient method to set the button's text
    text: function(text) {
      this.text = text;

      this.draw();
    },

    draw: function() {
      this.$.text(this.text);
    },
  });

  /*
   * Controllers
   */

  var ViewController = BasicObject.extend(
    [
      // The root view of this controller.
      'view',
      // Child view controllers
      'viewControllers',
      // Parent view controller or undefined
      'parentViewController'], {
    constructor: function(options) {
      if(!options) options = {};

      // Call the basic object's constructor.
      BasicObject.call(this, options);

      this.el = options.el;
      this.viewControllers = [];
      this.parentViewController
    },

    loadView: function() {
      // Notify the inherited controller that the view is about to be loaded.
      this.viewWillLoad();

      // Create a new View and pass it the el (el may be undefined)
      this.view = new View({el: this.el});

      // Notify the inherited controller that the view has been loaded and is ready.
      this.viewDidLoad();

      // Return the view so that who ever called this function can add the DOM Nodes.
      return this.view;
    },

    // Add a child view controller. This method will take care of calling
    // the appropriate methods to load the child controllers view.
    addChildViewController: function(controller) {
      if(controller.parentViewController) {
        controller.removeFromParentViewController();
      }

      this.viewControllers.push(controller);

      // Set this as the parent view controller
      controller.parentViewController = this;

      // Load the view of the child view controller
      controller.loadView();
    },

    // Remove a child view controller from the stack
    removeChildViewController: function(controller) {
      var idx = this.viewControllers.indexOf(controller);
      if(idx != -1) {
        delete this.viewControllers[idx];
        controller.parentViewController = undefined;
      }
    },

    removeFromParentViewController: function() {
      if(this.parentViewController) {
        this.parentViewController.removeChildViewController(this);
      }
    },

    // Will be called when the view is done loading and is set up.
    viewDidLoad:  function(){},
    // Will be called before any view loading is done.
    viewWillLoad: function(){},
  });


  /*
   * Basic DataStore. All New datastores inherit from this object
   */
  var DataStore = BasicObject.extend({
    open: function(name, callback, options) {},
    destroy: function(object, options) {},
    fetch: function(object, parameters, options) {},
    add: function(object, options) {},
  });

  /*
   * Application class, root of the application stack.
   */
  var Application = BasicObject.extend({
    didFinishLoading: function() {
      throw Error("didFinishLoading was not everwritten by subclass or Frame.Application was used directly as application class.");
    },
    willTerminate: function(){}
  });

  // Frame configuration options.
  Frame.config = {};

  // Objects
  Frame.BasicObject = BasicObject;
  Frame.Model = Model;

  // Views
  Frame.View = View;
  Frame.CanvasView = CanvasView;
  Frame.Button = Button;
  // Controllers
  Frame.ViewController = ViewController;

  Frame.DataStore = DataStore;
  Frame.defaultStore = undefined;

  Frame.Application = Application;

  // Methods
  Frame.createDefaultInstanceMethodOn = createDefaultInstanceMethodOn;
  Frame.has = __has;
  Frame.keys = __keys;
  Frame.makeArray = __makeArray;
  Frame.isBasicObject = __isBasicObject;
  Frame.gid = __gid;

  // Experimental collection
  var __emptyArray = [];
  var CollectionPrototype = {
    push: function(object) {
      __emptyArray.push.call(this, object);
    }
  };
  _.extend(CollectionPrototype, BasicObject.prototype);

  Frame.Collection = function(objects) {
    objects = objects || [];
    objects.__proto__ = CollectionPrototype;

    return objects;
  };

  /*
   * Frame (private) boot strap functions
   */

  function BootstrapDatabase(onReady) {
    if(Frame.config.db) {
      var db = Frame.config.db;

      // Indexeddb store
      if(db.type === 'Frame.IndexedStore') {
        // Initialize the data store
        var store = new Frame.IndexedStore();
        // Set the default store
        Frame.defaultStore = store;
        // Set the definition
        Frame.defaultStore.definition = db.definition;

        // Open database and call the onReady when ever it's done.
        store.open(db.name, onReady, db);
      } else if(false) {

      }
    } else { /* If no database continue initializing */
      onReady();
    }
  }

  function FrameBootstrapFramework(options) {
    // Bootstrap database (if any)
    BootstrapDatabase(options.onReady);
  }

  /*
   * Define the application accessor.
   * Once the application property is set it will use it to create
   * a new instance of that object and uses that as the root of your application.
   */
  Object.defineProperty(Frame, 'application', {
    set: function(ApplicationObject) {
      var app;

      // Create a new application instance from the given application class.
      app = new ApplicationObject();
      // Set Frame's application instance.
      this.applicationInstance = app;

      FrameBootstrapFramework({
        onReady: function() {
          app.didFinishLaunching();

          // If a rootViewController is set call the conrollers loadView method
          if(app.rootViewController) {
            // Set the body if no element has been set on the root controller.
            if(!app.rootViewController.el) app.rootViewController.el = 'body';

            // Load the view and draw it
            var view = app.rootViewController.loadView();
            view.draw();
          }
        }
      });

      // Set up the terminate callback
      $(window).on('beforeunload', function() {
        app.willTerminate();
      });
    },
  });


  window.Frame = Frame;
});
