require 'sinatra'
require 'json'

# Very simple restful resource
books = []
(1..10).each {|i| books << {isbn: i*99, title: "My book #{i}"} }

get '/books.?:format?' do
  content_type :json

  books.to_json
end

get '/books/:id.?:format?' do
  content_type :json

  books[0].to_json
end

patch '/books/:id.?:format?' do
  books[0][:title] = params[:book][:title]

  books[0].to_json
end

delete '/books/:id.?:format?' do
  content_type :json

  book = book.delete_at 0

  book.to_json
end

post '/books.?:format?' do
  content_type :json

  book << params[:book]

  params[:book].to_json
end
