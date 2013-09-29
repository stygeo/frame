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
  __makeArray = function(object) {
    if( !(object instanceof Array) ) {
      object = [object];
    }
    return object;
  },
  __isBasicObject = function(object) {
    return __has(object, 'basicObjectDefined');
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
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    // Copy over static methods
    for (var key in protoProps) {
      if (__has(protoProps, key)) {
        Surrogate.prototype[key] = protoProps[key];
      }
    }
    child.prototype = new Surrogate;

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

  // Basic low level object. Contains most low level object functions such as KVO & KVC.
  var BasicObject = function(options) {
    /* These values are not meant to be KVO. */
    // Determines whether this object is a basic object so you can distinguish them from regular objects.
    this.basicObjectDefined=true
    // The current id of the object
    this.gid = __gid();

    if(this.initialize) {
      // Call the initialize method if it's present and pass in the options
      this.initialize.apply(this, options);
    }
  };
  BasicObject.extend = __extend;

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

  BasicObject.prototype.properties = function() {
    return this._properties || (this._properties = {})
  }
  BasicObject.prototype.observers = function() {
    return this._observers || (this._observers = {})
  }


  // Specialized setter. Calls callbacks on observed values
  BasicObject.prototype.setProperty = function(key, value) {
    this.properties()[key] = value

    if(this.observers[key] && this.observers[key].length > 0) {
      for(var i = 0; i < this.observers[key].length; i++) {
        var observer = this.observers[key][i]
        if(observer !== undefined) {
          // Signal the observer
          observer.observeValueForKey.call(observer, key, value)
        }
      }
    }
  }

  // Basic object getter
  BasicObject.prototype.getProperty = function(key) {
    return this.properties()[key]
  }

  // Returns the given or sets the given key with value (Key Value Coding, KVC)
  BasicObject.prototype.valueForKey = function(value_or_key, key) {
    if(key === undefined) {
      return this.getProperty(value_or_key)
    }

    this.setProperty(key, value_or_key)
  }

  // Observe the given key. (Key Value Observing, KVO)
  BasicObject.prototype.addObserverForKey = function(observer, key, options) {
    if(this.observers[key] === undefined) {
      this.observers[key] = []
    }

    this.observers[key].push(observer)
  }

  // Remove the given observer with the specified key
  BasicObject.prototype.removeObserverForKey = function(observer, key) {
    if(this.observers[key]) {
      for(var i = 0; i < this.observers[key].length; i++) {
        if(this.observers[key][i] === observer) {
          delete this.observers[key][i]
          break
        }
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

      // Serialize the attributes
      this.serialize(attributes);

      if(this.initialize) {
        // Call the initialize method if it's present and pass in the options
        this.initialize.apply(this, options);
      }
    },
    // Load data from the remote source
    fetch: function(parameters, options) {
      this.__validateModel();

      $this = this;
      var url = ($.isFunction(this.url) ? this.url() : this.url);
      $.ajax(url, {
        type: "GET",
        success: function(data, textStatus, xhr) {
          // Serialize the attributes
          $this.serialize(data);
          // Call the success callback if it was specified
          if(options.success) {
            options.success.call($this, data, textStatus, xhr);
          }
        }
      });
    },

    save: function(parameters, options) {
      this.__validateModel();
    },

    serialize: function(serializableAttributes) {
      // Get the current object's constructor so we can bind values to it.
      var objectClass = this.constructor;

      // Iterate over the retrieved attributes
      for(var key in serializableAttributes) {
        // Model attributes are 'lazily' added.
        objectClass.property(key);
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
    __validateModel: function(){
      if(!this.url) throw "No URL specified for model";
    },
  });

  /*
   * Controllers
   */

  var ViewController = BasicObject.extend({
    // The root view of this controller.
    view: undefined,

    constructor: function(attributes, options) {
      // Call the basic object's constructor.
      BasicObject.call(this, options);

      if(this.initialize) {
        // Call the initialize method if it's present and pass in the options
        this.initialize.apply(this, options);
      }
    },

    loadView: function() {
      // Notify the inherited controller that the view is about to be loaded.
      this.viewWillLoad();

      // Create a new View and pass it the el (el may be undefined)
      this.view = new BasicObject({el: this.el});

      // Notify the inherited controller that the view has been loaded and is ready.
      this.viewDidLoad();

      // Return the view so that who ever called this function can add the DOM Nodes.
      return this.view;
    },

    // Will be called when the view is done loading and is set up.
    viewDidLoad:  function(){},
    // Will be called before any view loading is done.
    viewWillLoad: function(){},
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

  // Objects
  Frame.BasicObject = BasicObject;
  Frame.Model = Model;
  Frame.ViewController = ViewController;
  Frame.Application = Application;

  // Methods
  Frame.createDefaultInstanceMethodOn = createDefaultInstanceMethodOn;
  Frame.has = __has;
  Frame.keys = __keys;
  Frame.makeArray = __makeArray;
  Frame.isBasicObject = __isBasicObject;
  Frame.gid = __gid;

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

      app.didFinishLaunching();

      // If a rootViewController is set call the conrollers loadView method
      if(app.rootViewController) app.rootViewController.loadView();

      // Set up the terminate callback
      $(window).on('beforeunload', function() {
        app.willTerminate();
      });
    },
  });

  window.Frame = Frame;
});