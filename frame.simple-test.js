$(function() {
  function getErrorObject(){
    try { throw Error('') } catch(err) { return err; }
  }

  function describe(testDescription, callback) {
    window.currentTest = {success: 0, failed: 0};


    var testMessage = "Test: "+testDescription;
    $("body").append($("<h3/>").text(testMessage));
    console.log(testMessage);

    callback();

    var resMessage = "Success: "+window.currentTest.success+ " Failed: "+window.currentTest.failed;
    $("body").append($("<div/>").text(resMessage));
    console.log(resMessage);
  }

  function it(str, callback) {
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

  function getLineNumber() {
    var err = getErrorObject();
    var stack = err.stack.split("\n");
    var callerLine = stack[3].split("/");
    callerLine = callerLine[callerLine.length - 1];
    var index = callerLine.indexOf("at ");
    var file = stack[3].split(/:\d*:\d*$/)[0];

    return [callerLine.slice(index+1, callerLine.length), file];
  }

  function print(str, passed, callerLine, backgroundColor) {
    console.log(str);

    var el = $("<div/>");
    $("body").append(el.html(str + (passed ? '' : " =&gt; <a href='"+callerLine[1]+"'>"+callerLine[0]+"</a>")).css({background: backgroundColor, color: 'white'}));

  }

  it.skip = function(str) {
    var message = "SKIPPED: "+str;

    print(message, false, getLineNumber(), 'orange');
  }

  window.newTest = describe;
  window.test = it;
  window.it = it;
  window.describe = describe;
});
