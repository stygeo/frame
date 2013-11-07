require 'json'

require 'sinatra/base'
require 'faye/websocket'

require './helpers'

class SocketBackend
  KEEPALIVE_TIME = 15

  class << self
    attr_accessor :events

    def setup
      @events = {}

      yield self
    end

    def on(event, &block)
      @events[event] ||= []

      @events[event] << block
    end
  end

  def initialize(app)
    @app = app
    @clients = {}
    @channels = {}

    Faye::WebSocket.load_adapter('thin')
  end

  def call(env)
    if Faye::WebSocket.websocket?(env)
      req = Rack::Request.new(env)

      ws = Faye::WebSocket.new(env, nil, {ping: KEEPALIVE_TIME})

      socket_id = req.path.split("/").last
      puts socket_id

      ws.on :open do |event|
        message = pack_message(Type::EVENT, 'connect')

        ws.send( message )

        @clients[socket_id] = {socket: ws}
      end

      ws.on :message do |event|
        data = unpack_message(event.data)
        puts data

        to_call = nil

        case data["type"]
        when Type::EVENT
          event = data["data"]["name"].to_sym
          if event == :subscribe
            channel = (@channels[data["data"]["data"]] ||= {})
            channel[socket_id] = @clients[socket_id]
          else
            if SocketBackend.events[event]
              SocketBackend.events[event].each do |block|
                block.call(@clients)
              end
            end
          end
        when Type::MESSAGE

          if data["channel"] && @channels[data["channel"]]
            to_call = proc { @channels[data["channel"]].each { |sock_id, client| client[:socket].send( pack_message(Type::MESSAGE, data["data"], nil, data["channel"]) ) } }
          else
            to_call = proc { @clients.each { |sock_id, client| client[:socket].send( pack_message(Type::MESSAGE, data["data"]) ) } }
          end
        end

        if to_call
          EM.next_tick { to_call.call }
        end
      end

      ws.on :close do |event|
        @clients.delete(socket_id)
        @channels.each do |name, clients|
          clients.delete(socket_id)
        end
      end

      ws.rack_response
    else
      @app.call(env)
    end
  end
end

class App < Sinatra::Base
  set :sessions, true
  set :server, 'thin'
  set :sockets, {}
  set :channels, {}

  configure do
    SocketBackend.setup do |socket|
      socket.on :test_event do |clients|
        data = { action: 'update', resource: 'books', data: {id: 1, title: 'bar title'} }

        clients.each {|sock_id, client| client[:socket].send( pack_message(Type::EVENT, 'resource:store:modification', data) ) }
      end
    end

    use SocketBackend
  end

  get '/' do
    if !request.websocket?
    else
    end
  end

  # Initialize handshake
  get "/websocket" do
    id = generate_gid

    {id: id, beat: 10}.to_json
  end
end

