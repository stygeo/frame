require 'json'
require 'sinatra/base'

require './backend'

# Fake rails
module ActiveRecord
  class Base
    attr_accessor :resource_name, :attributes

    def initialize(attributes = {})
      self.resource_name = "book"
      self.attributes = attributes

      attributes.each do |key, value|
        self.class.send(:attr_accessor, key) unless self.respond_to? key

        self.instance_variable_set "@#{key}", value
      end
    end

    def title() @title end
    def title=(title)
      self.attributes[:title] = title

      @title = title
    end

    def save
      # Persisting data to database from rails would go here
    end

    class << self
      def find(id)
        return self.new({id: 1, title: 'bar title', student_id: 1234})
      end
    end
  end
end

# Faking rails model
class Book < ActiveRecord::Base
  include Frame::Model

  socket_sync proc { |book| "student-#{book.student_id}" }
end

class App < Sinatra::Base
  set :sessions, true
  set :server, 'thin'

  configure do
    Frame::SocketBackend.setup do |socket|
      socket.on :test_event do |group, data|
        resource = Book.find(1)
        if data && data["title"]
          resource.title = data["title"]
        end

        resource.save
      end
    end

    use Frame::SocketBackend
  end
end

