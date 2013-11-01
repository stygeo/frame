$(function() {
  var FrameHelpers = {}

  FrameHelpers.setInfo = function() {
    $("body").append($("<div/>").addClass('frame-footer').html("frame.js " + Frame.VERSION));
  }

  window.FrameHelpers = FrameHelpers;
});
