$(function() {
  function getErrorObject(){
    try { throw Error('') } catch(err) { return err; }
  }

  function newTest(testDescription, callback) {
    window.currentTest = {success: 0, failed: 0};


    var testMessage = "Test: "+testDescription;
    $("body").append($("<h3/>").text(testMessage));
    console.log(testMessage);

    callback();

    var resMessage = "Success: "+window.currentTest.success+ " Failed: "+window.currentTest.failed;
    $("body").append($("<div/>").text(resMessage));
    console.log(resMessage);
  }

  function test(str, callback) {
    var passed;
    var exception;
    var color;
    var err = getErrorObject();
    var stack = err.stack.split("\n");
    var callerLine = stack[2];
    var index = callerLine.indexOf("at ");
    var clean = callerLine.slice(index+2, callerLine.length);

    try {
      passed = callback();
    } catch(e) {
      passed = false;
      exception = e;
    }

    if(!passed) {
      str = "FAILED: "+str;

      if(exception) {
        str += "\n" + exception;
      }
      color = 'red';

      window.currentTest.failed++;

      console.log(str);
    } else {
      str = "PASSED: "+str;
      color = 'green';

      window.currentTest.success++;

      console.log(str);
    }

    var el = $("<div/>");
    $("body").append(el.html(str.replace("\n", "<br>") + (passed ? '' : "<br>"+callerLine)).css({background: color, color: 'white'}));
  }

  window.newTest = newTest;
  window.test = test;
});
