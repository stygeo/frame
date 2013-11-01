require 'sinatra'
require 'json'
require 'sinatra-websocket'

set :server, 'thin'
set :sockets, []

def parse text_or_json
  begin
    JSON.parse text_or_json
  rescue
    text_or_json
  end
end

get '/' do
  if !request.websocket?
    erb :index
  else
    request.websocket do |ws|
      ws.onopen do
        warn request.session.inspect

        ws.send({type: 'init', data: "Hello world"}.to_json)
        settings.sockets << ws
      end

      ws.onmessage do |msg|
        json_msg = parse msg
        response = case json_msg["event"]
        when 'message:post'
          {event: 'message:new', data: {message: 'PONG'}}
        end

        #warn "Responding with #{response}"

        EM.next_tick { settings.sockets.each{|s| s.send(response.to_json) } }
      end
      ws.onclose do
        warn("wetbsocket closed")
        settings.sockets.delete(ws)
      end
    end
  end
end

__END__
@@ index
<html>
  <body>
     <h1>Simple Echo & Chat Server</h1>
     <form id="form">
       <input type="text" id="input" value="send a message"></input>
     </form>
     <div id="msgs"></div>
  </body>

  <script type="text/javascript">
    window.onload = function(){
      (function(){
        var show = function(el){
          return function(msg){ el.innerHTML = msg + '<br />' + el.innerHTML; }
        }(document.getElementById('msgs'));

        var ws       = new WebSocket('ws://' + window.location.host + window.location.pathname);
        ws.onopen    = function()  { show('websocket opened'); };
        ws.onclose   = function()  { show('websocket closed'); }
        ws.onmessage = function(m) { show('websocket message: ' +  m.data); };

        var sender = function(f){
          var input     = document.getElementById('input');
          input.onclick = function(){ input.value = "" };
          f.onsubmit    = function(){
            ws.send(input.value);
            input.value = "send a message";
            return false;
          }
        }(document.getElementById('form'));
      })();
    }
  </script>
</html>

