require 'json'
require 'sinatra/base'

require '../websocket/backend'
require './fake_ar.rb'

# Faking rails model
class Todo < ActiveRecord::Base
  include Frame::Model

  socket_sync :todo #proc { |book| "student-#{book.student_id}" }
end

class TodosSocketController < Frame::SocketController
  def update
    resource = Todo.find(params[:id])

    resource.update_attributes params[:todo]
  end

  def show
    resource = Todo.find(params[:id])
    resource.sync
  end
end

class App < Sinatra::Base
  set :sessions, true
  set :server, 'thin'

  configure do
    Frame::Router.config do |c|
      c.resource :todos
    end

    use Frame::SocketBackend
  end
end

