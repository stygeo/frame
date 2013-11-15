(function(window) {
  if(!('Frame' in window)) { throw new Error("Included frame.glkit but Frame is undefined"); }

  var requestAnimationFrame = (function(callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
      function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
  })();

  /*
   * WebGL view
   */
  var WebGLView = Frame.View.extend({
    // Canvas element
    element: 'canvas',
    // WebGL context
    gl: undefined,
    constructor: function(options) {
      Frame.View.call(this, options);

      this.createRenderingContext();
    },

    createRenderingContext: function() {
      var gl = null;

      try {
        gl = this.$[0].getContext('webgl') || this.$[0].getContext('experimental-webgl');
      } catch(e) { console.log(e); }

      if(!gl) { /* TODO error handling */ return; }

      gl.viewport(0, 0, this.$.width(), this.$.height());

      this.gl = gl;
    },
  });

  /*
   * WebGL View controller
   */
  var WebGLViewController = Frame.ViewController.extend({
    // WebGL Context. Taken from View.
    constructor: function(options) {
      Frame.ViewController.call(this, options);
    },

    updateFrame: function() {
      requestAnimationFrame(_.bind(function() {
        // Call the user sub classed view's update method
        this.update();

        // Reschedule update
        this.updateFrame();
      }, this));
    },

    // It's absolutely necessary to call this (super) function at the end of your own viewDidLoad
    viewDidLoad: function() {
      this.updateFrame();
    },

    loadView: function() {
      // Notify the inherited controller that the view is about to be loaded.
      this.viewWillLoad();

      // Create a new View and pass it the el (el may be undefined)
      this.view = new WebGLView({el: this.el});

      // Set the gl context
      if(this.view.gl) this.gl = this.view.gl;

      // Notify the inherited controller that the view has been loaded and is ready.
      this.viewDidLoad();

      // Return the view so that who ever called this function can add the DOM Nodes.
      return this.view;
    },

    // Update will be called on each frame update
    update: function() {}
  });

  // Expose classes
  Frame.WebGLView = WebGLView;
  Frame.WebGLViewController = WebGLViewController;

  // Register AMD module.
  if(typeof define === "function" && define.amd) {
    define("frame.webgl", [], function() { return {WebGLView: WebGLView, WebGLViewController: WebGLViewController}; });
  }
})(window);
