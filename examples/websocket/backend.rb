require 'faye/websocket'
require 'json'

require 'active_support/core_ext'
require 'active_support/inflector'
require 'active_support/hash_with_indifferent_access'

String.send(:include, ActiveSupport::Inflector)

module Frame
  module Type
    DISCONNECT = 0
    MESSAGE = 1
    JSON = 2
    EVENT = 3
  end

  class Socket
    attr_accessor :websocket, :id

    def initialize websocket, id
      @websocket = websocket
      @id = id
    end

    def send(event_type, data, channel = nil)
      payload = pack(Type::EVENT, name: event_type, data: data, channel: channel)

      puts "Tx: #{payload}"

      @websocket.send payload
    end

    protected
    def unpack payload
      data = JSON.parse(payload)
    end

    def pack(type, options = {})
      payload = case type
                when Type::DISCONNECT
                when Type::MESSAGE
                  options[:data]
                when Type::JSON
                  options[:data].to_json
                when Type::EVENT
                  {name: options[:name], data: options[:data]}
                end

      return {type: type, data: payload, channel: options[:channel]}.to_json
    end
  end

  class Group
    attr_accessor :name

    def initialize sockets, name = nil
      @sockets = sockets
      @name = name
    end

    def send(event_type, data)
      EM.next_tick do
        @sockets.each do |socket|
          socket.send(event_type, data, @name)
        end
      end
    end

    def each
      return @sockets.each(&block)
    end
  end

  # [] is a shortcut
  def self.[](val)
    SocketBackend.backend.channel(val)
  end

  class SocketBackend
    KEEPALIVE_TIME = 15

    class << self
      attr_accessor :events, :backend

      def setup

        yield self
      end

      def on(event, &block)
        @events ||= {}

        @events[event] ||= []

        @events[event] << block
      end
    end

    def initialize(app)
      self.class.backend = self

      @app = app
      @clients = {}
      @channels = {}

      Faye::WebSocket.load_adapter('thin')

      self.bind_default_events
    end

    def generate_gid(length = 6)
      #o = [(0..9), ('a'..'z'), (0..9)].map { |i| i.to_a }.flatten
      #(0...length).map{ o[rand(o.length)] }.join
      SecureRandom.hex length
    end

    def channel(name)
      Group.new(@channels[name] ? @channels[name].values : [], name)
    end

    def bind_default_events
      self.class.on :resource_sync do |group, data|
        resource = data["resource"]
        action   = data["action"]

        controller = Frame::Router.route_resource! resource, action

        controller.params = data["data"]

        puts controller.inspect

        controller.perform!
      end
    end

    def call(env)
      req = Rack::Request.new(env)

      if Faye::WebSocket.websocket?(env)

        ws = Faye::WebSocket.new(env, nil, {ping: KEEPALIVE_TIME})

        socket_id = req.path.split("/").last
        puts "Frame::Socket - Connection accepted (#{socket_id})"

        ws.on :open do |event|
          socket = Socket.new(ws, socket_id)

          @clients[socket_id] = socket

          if(req.params['channels'] && req.params['channels'].is_a?(Array))
            req.params['channels'].each do |channel_name|
              channel = (@channels[channel_name.to_sym] ||= {})
              channel[channel_name.to_sym] = socket
            end
          end

          socket.send('connect', nil)
        end

        ws.on :message do |event|
          data = JSON.parse(event.data)
          puts "Rx: #{data}"

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
                  if data["channel"] && @channels[data["channel"]]
                    block.call(Group.new(@channels[data["channel"]].values, data["channel"]), data["data"]["data"])
                  else
                    block.call(Group.new(@clients.values, nil), data["data"]["data"])
                  end
                end
              end
            end
          when Type::MESSAGE

            #if data["channel"] && @channels[data["channel"]]
              #to_call = proc { @channels[data["channel"]].each { |sock_id, client| client[:socket].send( pack_message(Type::MESSAGE, data["data"], nil, data["channel"]) ) } }
            #else
              #to_call = proc { @clients.each { |sock_id, client| client[:socket].send( pack_message(Type::MESSAGE, data["data"]) ) } }
            #end
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
        # Handshake
        if req.path == '/websocket'
          gid = self.generate_gid

          return [200, { 'Content-Type' => 'application/json' }, [ {id: gid, beat: 10}.to_json ]]
        else
          @app.call(env)
        end
      end
    end
  end

  module Model
    def self.included base
      base.send(:extend, ClassMethods)
    end

    module ClassMethods
      def socket_sync channel
        unless self.respond_to? :socket_sync_channel
          self.class_eval do
            class << self
              attr_accessor :socket_sync_channel
            end

            alias_method :old_save, :save
            def save with_raise = false
              self.old_save

              data = { action: 'update', resource: self.resource_name, data: self.attributes }

              Frame[self.socket_sync_channel].send('resource_sync', data)
            end

            def sync
              data = { action: 'sync', resource: self.resource_name, data: self.attributes }

              Frame[self.socket_sync_channel].send('resource_sync', data)
            end
          end
        end

        self.socket_sync_channel = channel
      end
    end

    def socket_sync_channel
      channel = self.class.socket_sync_channel

      if channel.is_a? Proc
        channel.call(self)
      else
        channel
      end
    end
  end

  class SocketController
    attr_accessor :params

    def params= data
      @params ||= ActiveSupport::HashWithIndifferentAccess.new
      @params[@resource_name] = data

      @params[:id] = data["id"] if data["id"]
    end

    def set_action action, resource_name
      @resource_name = resource_name.to_sym

      @performing_action = action
    end

    def perform!
      self.send @performing_action
    end
  end

  module Router
    @@resources = []

    def self.config
      yield self
    end

    def self.resource resource_name
      @@resources << resource_name.to_sym
    end

    def self.route_resource! resource_name, action
      @@resources.include? resource_name.to_sym

      resource_class = "#{resource_name.pluralize}_socket_controller".camelcase
      begin
        klass = resource_class.constantize

        instance = klass.new
        instance.set_action action, resource_name.singularize

        return instance
      #rescue
      #  raise "Expected class `#{resource_class}` to be defined"
      end
    end
  end
end
