require 'sinatra'
require 'json'

# Very simple restful resource
books = []
(1..10).each {|i| books << {id: i, isbn: i*99, title: "My book #{i}"} }

get '/books.?:format?' do
  puts "params: #{params}"

  content_type :json

  books.to_json
end

get '/books/:id.?:format?' do
  puts "params: #{params}"

  content_type :json

  books[0].to_json
end

patch '/books/:id.?:format?' do
  puts "params: #{params}"

  content_type :json

  books[0][:title] = params[:book][:title]

  books[0].to_json
end

delete '/books/:id.?:format?' do
  puts "params: #{params}"

  content_type :json

  book = books.delete_at params[:id].to_i

  book.to_json
end

post '/books.?:format?' do
  puts "params: #{params}"

  content_type :json

  books << params[:book]
  params[:book][:id] = books.index(params[:book])

  params[:book].to_json
end
