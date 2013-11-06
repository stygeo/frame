require 'sinatra'
require 'json'
require 'sinatra-websocket'

set :server, 'thin'
set :sockets, {}
set :channels, []

module Type
  DISCONNECT = 0
  MESSAGE = 1
  JSON = 2
  EVENT = 3
end

def unpack_message payload
  arr = text.split(":")

  payload = case arr[0]
            when Type::DISCONNECT
            when Type::MESSAGE
              arr[0]
            when Type::JSON
              JSON.parse arr[1]
            end

  return {type: arr[0], payload: payload}
end

def pack_message type, payload, extra=nil, channel=nil
  payload = case type
            when Type::DISCONNECT
            when Type::MESSAGE
              payload
            when Type::JSON
              payload.to_json
            when Type::EVENT
              {name: payload, data: extra}
            end

  return {type: type, data: payload, channel: channel}.to_json
end

def parse text_or_json
  begin
    JSON.parse text_or_json
  rescue
    text_or_json
  end
end

get '/' do
  if !request.websocket?
  else
  end
end

o = [(0..9), ('a'..'z'), (0..9)].map { |i| i.to_a }.flatten
# Initialize handshake
get "/websocket" do
  id = (0...12).map{ o[rand(o.length)] }.join

  {id: id, beat: 10}.to_json
end

# Initialize previous created session
get "/websocket/:id" do
  if request.websocket?
    socket_id = params[:id]

    request.websocket do |ws|
      ws.onopen do
        message = pack_message(Type::EVENT, 'connect')

        ws.send( message )

        settings.sockets[socket_id] = {socket: ws}
      end

      ws.onmessage do |msg|
        puts "#{msg} from: #{socket_id}"
        response = socket_id

        #EM.next_tick { settings.sockets.each{|s| s.send(response.to_json) } }
      end

      ws.onclose do
        settings.sockets.delete(ws)
      end
    end
  end
end
