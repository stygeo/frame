$(function() {
  function getErrorObject(){
    try { throw Error('') } catch(err) { return err; }
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

  function describe(testDescription, callback) {
    window.currentTest = {success: 0, failed: 0, skipped: 0};


    $("body").append($("<h3/>").text(testDescription));
    console.log(testDescription);

    callback();

    var resMessage = "Success: "+window.currentTest.success+ " Skipped: "+window.currentTest.skipped + " Failed: "+window.currentTest.failed;
    $("body").append($("<div/>").text(resMessage));
    console.log(resMessage);
  }

  function it(str, callback) {
    var passed;
    var exception;

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
    } else {
      str = "PASSED: "+str;
      color = 'green';

      window.currentTest.success++;
    }

    print(str, passed, getLineNumber(), color);
  }

  it.skip = function(str) {
    var message = "SKIPPED: "+str;

    window.currentTest.skipped++;

    print(message, false, getLineNumber(), 'orange');
  }

  window.newTest = describe;
  window.test = it;
  window.it = it;
  window.describe = describe;
});
