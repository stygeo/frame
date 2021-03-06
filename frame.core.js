(function(window) {

  var __version = '0.1';

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
      GID = prefix+"-"+GID;
    }

    return GID;
  }

  /*
   * Push state
   *
   * Frame requires it's own push state function in order to call the proper callbacks
   * and trigger a 'pushstate' event.
   */
  window.history.originalPushState = window.history.pushState;
  window.history.pushState = function(state) {
    var r = window.history.originalPushState.apply(window.history, arguments);

    $(window).trigger('pushstate', state);

    return r;
  }

  // Inflectors
  String.prototype.pluralize = function() {
    return (this[this.length-1] === 's' ? this : this + 's');
  }
  String.prototype.singularize = function() {
    return (this[this.length-1] === 's' ? this.substr(0, this.length - 1) : this);
  }
  String.prototype.camelCase = function() {
    return this.toLowerCase().replace(/-(.)/g, function(match, group1) {
      return group1.toUpperCase();
    });
  };

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
      properties = propertiesOrProtoProps;
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

  var VariableConstructor = function(constructor, args) {
    function F() {
      return constructor.apply(this, args);
    }
    F.prototype = constructor.prototype;

    return new F();
  };

  /* Basic event target */
  var EventTarget = {
    getEvent: function(event) {
      if(this._events === undefined) this._events = {};

      // Return the event property or return the event list based on the argument
      if(event !== undefined) {
        // Set a default array
        if(this._events[event] === undefined) this._events[event] = [];

        return this._events[event];
      }
      else return this._events;
    },

    /*
     * On (event)
     * event: the event
     * callback: callback to invoke upon 'trigger'
     * scope: object used for 'call' method.
     */
    on: function(event, callback, scope) {
      // Push the callback to the event stack
      var eventListeners = this.getEvent(event);
      eventListeners.push({callback: callback, scope: scope});

      // Return the collection so we may chain
      return this;
    },
    off: function(event, callback) {
      if(callback === undefined) {
        this.getEvent(event).length = 0;
      } else if(typeof callback === 'function') {
        var events = this.getEvent(event);

        for(var i = 0; i < events.length; i++) {
          var v = events[i];
          if(v.callback === callback) {
            events.splice(i, 1);
            break;
          }
        }
      // If callback is object it's an key value hash
      } else if(typeof callback === 'object') {
        var object = event,
            options = callback,
            events = this._events;

        if('for' in options && options.for) {
          for(var event in events) {
            var observers = events[event];

            for(var i = 0; i < observers.length; i++) {
              var observer = observers[i];

              if(typeof observer.scope === 'object') {
                observers.splice(i, 1);
                // Restart the loop, because the index has changed
                i = 0;
              }
            }
          }
        }

        else if('all' in options && options.all) {
          // Find all observers
          for(var event in events) {
            var allObservers = [];
            var observers = events[event];
            // Loop over each observer
            for(var i = 0; i < observers.length; i++) {
              var v = observers[i];
              // The event must be an object of some sort
              if(typeof v.scope === 'object') {allObservers.push(v);}
            }

            // Remove the observers
            for(var i = 0; i < allObservers.length; i++) {
              events[event].splice(events[event].indexOf(allObservers[i]), 1);
            }
          }

        }
      }
    },

    /*
     * Trigger (event)
     * Trigger a specific event
     * event: event you'd like to trigger
     */
    trigger: function(event, data) {
      var customEvent = new CustomEvent(event);
      customEvent.customData = data;

      // Loop over each event-callback and invoke the callback (w/ optionally the scope)
      var events = this.getEvent(event);
      for(var i = 0; i < events.length; i++) {
        var v = events[i]

        if(v !== undefined) v.callback.call(v.scope || this, customEvent, data);
      }
    },
  };

  var Construct = function(){};
  Construct.extend = __extend;

  // Basic low level object. Contains most low level object functions such as KVO & KVC.
  var BasicObject = Construct.extend({
    constructor: function(attributes) {
      /* These values are not meant to be KVO. */
      // Determines whether this object is a basic object so you can distinguish them from regular objects.
     // this.basicObjectDefined=true
      // The current id of the object
      this.gid = __gid();

      // Serialize the attributes
      this.serialize(attributes);
    },

    properties: function() {
      if(this._properties === undefined) {
        this._properties = {};

        var _this = this;
        // Assign the known properties to the object
        this.constructor.properties.forEach(function(property) {
          _this._properties[property] = undefined;
        });
      }

      return this._properties;
    },

    // Specialized setter. Calls callbacks on observed values
    setProperty: function(key, value, options) {
      var isNew = !this.properties()[key];

      this.properties()[key] = value

      if(isNew) { this.trigger("" + key + ":new"); }

      this.trigger("" + key + ":change");

      if(!options || (options && !options.noChangeTrigger)) { this.trigger('change', new Collection(key)); }
    },

    // Basic object getter
    getProperty: function(key) {
      return this.properties()[key]
    },

    // Returns the given or sets the given key with value (Key Value Coding, KVC)
    valueForKey: function(value_or_key, key, options) {
      if(key === undefined) {
        return this.getProperty(value_or_key)
      } else {
        this.setProperty(key, value_or_key, options)
      }
    },

    // Serialization of attributes
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
        this.valueForKey(serializableAttributes[key], key, {noChangeTrigger: true});
      }

      if(serializableAttributes) { this.trigger('change', new Collection(_.keys(serializableAttributes))); }
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
  });
  _.extend(BasicObject, EventTarget);
  _.extend(BasicObject.prototype, EventTarget);

  // Public property setter. Creates specialized properties which can be accessed through KVC and make use of KVO
  BasicObject.property = function(propertyNames) {
    propertyNames = __makeArray(propertyNames);

    // Assign the known attributes to Object so we can reference it when creating a new 'properties' Object within the instance of the object.
    this.properties = _.uniq( (this.properties || (this.properties = [])).concat( propertyNames ) );

    var prototype = this.prototype;

    propertyNames.forEach(function(propertyName) {
      if( !(propertyName in prototype) ) {
        Object.defineProperty(prototype, propertyName, {
          enumerable: true,
          get: function() {
            return this.getProperty(propertyName)
          },
          set: function(value) {
            this.setProperty(propertyName, value)
          }
        });
      }
    });
  }

  /*
   * Collection
   */
  var __emptyArray = [];
  var CollectionPrototype = {
    forEach: __emptyArray.forEach,

    push: function(object) {
      __emptyArray.push.call(this, object);

      this.trigger('change', object);
    },

    clear: function(arrayOrUndefined) {
      this.length = 0;

      if(arrayOrUndefined !== undefined) {
        // We do not want to trigger a callback for each element
        // added if it's being observed.
        for(var i = 0; i < arrayOrUndefined.length; i++) {
          __emptyArray.push.call(this, arrayOrUndefined[i]);
        }

        this.trigger('reset', this);
      }

      return this;
    },

    // Same as clear
    reset: function(array) {return this.clear(array);},

    each: function(callback, scope) {
      for(var i = 0; i < this.length; i++) {
        callback.call(scope || this, this[i], i);
      }
    }
  };

  var Collection = function(array) {
    var a;
    if(array instanceof Array) {
      a = array;
    } else {
      // Splat argument array
      a = Array.prototype.slice.call(arguments, 0);
    }

    if(a.length > 0) __emptyArray.push.apply(this, a);
  }
  Collection.prototype = new Array();
  _.extend(Collection.prototype, CollectionPrototype);
  _.extend(Collection.prototype, BasicObject.prototype);
  _.extend(Collection.prototype, EventTarget);

  /*
   * Frame.Model data object.
   */
  // The basic model. Inherit from this object.
  var Model = BasicObject.extend({
    constructor: function(attributes, options) {
      // Dirty attributes are attributes which have been changed and haven't been persisted.
      this.dirtyAttributes = [];

      // Call the basic object's constructor.
      BasicObject.call(this, attributes);

      // Define this as a new model.
      this.isNew = true;

      // Flag all attributes as dirty when a new instance has been created
      if(attributes) {
        this.setDirtyAttributes( _.keys(attributes) );
      }
    },

    // Overwrite setProperty so we may flag it as dirty
    setProperty: function(key, value, options) {
      // Call super
      Model.__super__.setProperty.call(this, key, value, options);

      // Flag the attribute as dirty
      this.setDirtyAttributes(key);
    },

    setDirtyAttributes: function(attributes) {
      if(attributes instanceof Array) {
        this.dirtyAttributes = this.dirtyAttributes.concat(attributes);
      } else {
        this.dirtyAttributes.push(attributes);
      }

      this.dirtyAttributes = _.uniq(this.dirtyAttributes);
    },

    fetch: function(parameters, options) {
      if(!options) options = {};

      Frame.defaultStore.fetch(this, parameters, options);
    },

    save: function(options) {
      if(!options) options = {};

      if(this.isNew) {
        Frame.defaultStore.add(this, options);
      } else {
        Frame.defaultStore.update(this, options);
      }

      // Reset dirty attributes
      this.dirtyAttributes = [];
    },

    destroy: function(options) {
      Frame.defaultStore.destroy(this, options);
    },

    // Sync the object with the server. (Only used by SocketStore)
    sync: function(options) {
      options = options || {};

      Frame.defaultStore.sync(this, options);
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
  Model.all = function(collection, options) {
    Frame.defaultStore.all(collection, this, options);
  };

  var NotificationCenter = BasicObject.extend({
    // Overwrite on and off to ensure certain variables
    on: function(event, object, method) {

      BasicObject.on.call(this, event, method, object);
    },

    off: function(event, object) {
      BasicObject.off.call(this, event, {for: object})
    }
  });
  createDefaultInstanceMethodOn(NotificationCenter);

  /*
   * Routing handler
   */
  var Router = BasicObject.extend({
    constructor: function(scope) {
      BasicObject.call(this);

      // The scope used for this argument when calling the handlers
      this.scope = scope;
      // Routes currently in operative for this hash handler
      this.routes = [];

      // Bind all for hashChanged
      this.boundPopstate = _.bind(this.popstate, this);

      this.enable();
    },

    go: function(url, title) {
      window.history.pushState(null, title || window.document.title, url);
    },

    popstate: function(e) {
      var hash = this.hash();
      for(var i = 0; i < this.routes.length; i++) {
        var route = this.routes[i];

        this.testRoute(hash, route);
      }
    },

    testRoute: function(hash, route) {
      var matches;
      if(matches = route.matcher.regexp.exec(hash)) {
        if(route.callback && this.enabled) {
          route.callback.apply(this.scope, matches.slice(1, matches.length));
        }

        return true;
      }

      return false;
    },

    generateMatcher: function(route) {
      var variableMatcher = "([A-Za-z0-9_\-]*)"
          parts = route.split("/"),
          matcher = [],
          variables = 0

      for(var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if(/:.*/.test(part)) {
          matcher.push(variableMatcher);
          variables++;
        } else {
          matcher.push(part);
        }
      }

      return {
        variables: variables,
        regexp: new RegExp(matcher.join("/"))
      }
    },

    getPathName: function() {
      return window.location.pathname;
    },

    hash: function() {
      var path = this.getPathName();
      if(path === undefined) return '';
      else return path;
    },

    /* Route is another function for 'on' which scopes automatically */
    route: function(route, callback) {
      var route = {
        matcher: this.generateMatcher(route),
        callback: callback
      };
      this.routes.push(route);

      this.testRoute(this.hash(), route);
    },

    disable: function() {
      this.enabled = false;

      // Remove event listener
      $(window).off('popstate', this.boundPopstate);
      $(window).off('pushstate', this.boundPopstate);
    },

    enable: function() {
      this.enabled = true;
      // Bind on hash change event on window to get notified once a hash has changed
      $(window).on('popstate', this.boundPopstate);
      $(window).on('pushstate', this.boundPopstate);
    },

    // Disables and removed all events
    removeAllRoutes: function() {
      this.disable();
      this.routes = [];
    },
  });

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
    tag: 'div',

    // Basic view contstructor
    constructor: function(options) {
      if(!options) options = {};

      // Call the basic object's constructor.
      BasicObject.call(this);

      // Set the element of the controller
      this.el = options.el;
      // set the tag of the controller (if specified)
      if(options.tag) this.tag = options.tag;

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
      // Notify view it will be moved to a superview
      subview.willMoveToSuperview(this);

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

        subview._wasRemovedFromSuperView();
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
      // If called without arguments
      if(event === undefined) {
        this.$.off(); return;
      }

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
    _wasRemovedFromSuperView: function() {
      // Remove from DOM
      this.$.remove();
      // Unbind all event handlers
      this.off();

      // Call user defined unbinding handler
      if(this.wasRemovedFromSuperView!== undefined) this.wasRemovedFromSuperView();
    },

    willMoveToSuperview: function(){},

    // Basic draw method. Should be overwritten for custom drawing
    draw: function() {},
  });
  // Generic accessor for the view's element (either created or 'fetched').
  Object.defineProperty(View.prototype, "$", {
    enumerable: true,

    get: function() {
      if(!this.__collection) {
        // Get the bound element or create a new element.
        var element = this.el || '<'+this.tag+'/>';

        this.__collection = $(element);
        // Set the Frame view as 'data' attribute
        this.__collection.data('view', this);
        // Add classes set this view cssClass attribute.
        this.__collection.addClass(this.cssClass);
      }

      return this.__collection;
    },

    // Replace the current content with the new content.
    // Creates a new jQuery selector
    set: function(html) {
      // The original element
      var original = this.$;

      // Create new jquery selector
      this.__collection = $(html);

      // Set the Frame view as 'data' attribute
      this.__collection.data('view', this);

      // Replace the original element with the new data
      original.replaceWith(this.__collection);
    }
  });


  /*
   * DataView
   *
   * Data view taking care of rendering a template with the model provided
   *
   * It assumes the following things:
   * - a render engine is set
   * - a model is passed
   * - templates have their respective data-attributes set (these reflect the attributes in the model)
   * Whenever a attribute on the model changes the view automatically updates the corresponding element(s)
   */
  var DataView = View.extend({
    constructor: function(model, options) {
      options = options || {};

      Frame.View.call(this, options);

      this.model = model;
    },

    onchange: function(ev, attributes) {
      // Call update with the change attributes
      this.update(attributes);
    },

    data: function() {
      return this.model.toJSON();
    },

    draw: function() {
      // Use the render engine to render the view
      var html = Frame.renderEngine.render(this.template, this.data());
      // Reset the jQuery selector
      this.$ = html;

      // keyup and change events trigger changes to the model that reflect the data attribute.
      this.$.find("input[data-attribute]").on('keyup change', _.bind(function(event) {
        // Sync the input to the model
        this.sync(event.currentTarget);
      }, this));
    },

    sync: function(el) {
      el = $(el);

      var attribute, value;

      // Get the attribute of the element
      attribute = el.data('attribute');
      // Test if element is a 'checkbox'. Check boxes are threated differently
      if(el.is(':checkbox')) {
        value = el.is(':checked');
      } else {
        value = el.val();
      }

      // Set the model's attribute to the value of the input (element).
      this.model[attribute] = value;
    },

    update: function(attributes) {
      // Loop thru each attribute and update the appropriate element by using the data-attribute
      attributes.each(function(attribute) {
        // Update the corresponding element
        this.$.find("[data-attribute='"+attribute+"']").text( this.model.valueForKey(attribute) );
      }, this);
    }
  });
  // Define the model attribute which automatically binds/unbinds
  Object.defineProperty(DataView.prototype, 'model', {
    enumerable: true,
    set: function(model) {
      if(this._model) {
        this._model.off('change', this.onchange, this);
      }

      // Bind to change event so we can update the view
      model.on('change', this.onchange, this);

      this._model = model;

      // Draw if a new model is set
      this.draw();
    },
    get: function() { return this._model; }
  });

  // Generic button view
  var Button = View.extend({
    tag: 'button',

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
      BasicObject.call(this);

      this.el = options.el;
      this.viewControllers = [];
    },

    loadView: function() {
      // Notify the inherited controller that the view is about to be loaded.
      this.viewWillLoad();

      // Create a new View and pass it the el (el may be undefined)
      this.view = new View({el: this.el, tag: this.tag});

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
      this.view.addSubview(controller.loadView());
    },

    // Remove a child view controller from the stack
    removeChildViewController: function(controller) {
      var idx = this.viewControllers.indexOf(controller);
      if(idx != -1) {
        // Remove the view from the superview
        conttroller.view.removeFromSuperview();

        controller.parentViewController = null;

        // Remove the view controller
        this.viewControllers.splice(idx, 1);
      }
    },

    removeFromParentViewController: function() {
      if(this.parentViewController) {
        this.parentViewController.removeChildViewController(this);
      }
    },

    // On DOM event. Uses basic jQuery event handling.
    on: function(event, cb) {
      // Try and split events such as 'click #selector' and perform any find queries necessary.
      var eventSelector = splitEventSelector(event);
      var callback = _.bind(cb, this);
      if(eventSelector.selector) {
        this.view.$.on(eventSelector.event, eventSelector.selector, callback);

      } else {
        this.view.$.on(eventSelector.event, callback);
      }
    },

    // Remove DOM event.
    off: function(event, cb) {
      // If called without arguments
      if(event === undefined) {
        this.view.$.off(); return;
      }

      // Try and split events such as 'click #selector' and perform any find queries necessary.
      var eventSelector = splitEventSelector(event);
      var callback = _.bind(cb, this);
      if(eventSelector.selector) {
        this.view.$.find(eventSelector.selector).off(eventSelector.event, callback);
      } else {
        this.view.$.off(eventSelector.event, callback);
      }
    },

    // Will be called when the view is done loading and is set up.
    viewDidLoad:  function(){},
    // Will be called before any view loading is done.
    viewWillLoad: function(){},
  });
  Object.defineProperty(ViewController.prototype, 'router', {
    enumerable: true,
    get: function() {
      if(this._router === undefined) this._router = new Router(this);

      return this._router;
    },
  });


  /*
   * Basic DataStore. All New datastores inherit from this object
   */
  var DataStore = BasicObject.extend({
    open: function(name, callback, options) {},
    destroy: function(object, options) {},
    fetch: function(object, parameters, options) {},
    add: function(object, options) {},
    all: function(collection, options) {},
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



  /*
   * Render engines
   */
  var RenderEngine = BasicObject.extend({
    render: function(template, data){},
    update: function(template, data){},
  });

  var EJSRenderEngine = RenderEngine.extend({
    render: function(template, data) {
      return new EJS({url: template + ".ejs"}).render(data);
    },

    update: function() {
    }
  });


  // Frame collection helper
  var Frame = function(a) {
    if(!(a instanceof Array)) {
      // Set a to arguments if it's not an array
      a = Array.prototype.slice.call(arguments, 0);
    }

    return VariableConstructor(Collection, a);
  };

  // Frame configuration options.
  Frame.config = {};

  // Objects
  Frame.BasicObject = BasicObject;
  Frame.NotificationCenter = NotificationCenter;
  Frame.Model = Model;
  Frame.Router = Router;
  Frame.Collection = Collection;

  // Expose Frame's 'EventTarget' implementation
  Frame.EventTarget = EventTarget;

  // Views
  Frame.View = View;
  Frame.DataView = DataView;
  Frame.CanvasView = CanvasView;
  Frame.Button = Button;
  // Controllers
  Frame.ViewController = ViewController;

  Frame.DataStore = DataStore;
  Frame.defaultStore = undefined;

  Frame.RenderEngine = RenderEngine;
  Frame.EJSRenderEngine = EJSRenderEngine;
  Frame.renderEngine = undefined;

  Frame.Application = Application;

  // Methods
  Frame.createDefaultInstanceMethodOn = createDefaultInstanceMethodOn;
  Frame.has = __has;
  Frame.keys = __keys;
  Frame.makeArray = __makeArray;
  Frame.isBasicObject = __isBasicObject;
  Frame.gid = __gid;

  Frame.VERSION = __version;

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
          app.didFinishLaunching(Frame);

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

  // Register AMD module.
  if(typeof define === "function" && define.amd) {
    define("frame.core", [], function() { return Frame; });
  }
})(window);
