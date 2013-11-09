require 'json'
require 'sinatra/base'

require './backend'

# Fake rails
module ActiveRecord
  class Base
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

  attr_accessor :resource_name, :attributes

  socket_sync proc { |book| "student-#{book.student_id}" }

  def initialize(attributes = {})
    self.resource_name = "book"
    self.attributes = attributes

    attributes.each do |key, value|
      self.class.send(:attr_accessor, key) unless self.respond_to? key

      self.instance_variable_set "@#{key}", value
    end
  end

end

class App < Sinatra::Base
  set :sessions, true
  set :server, 'thin'

  configure do
    Frame::SocketBackend.setup do |socket|
      socket.on :test_event do |group|
        resource = Book.find(1)

        resource.save
      end
    end

    use Frame::SocketBackend
  end
end

