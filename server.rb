require 'sinatra'
require 'stripe'
require 'dotenv/load'
require 'awesome_print'

# Load keys from env variables
Stripe.api_key = ENV['SECRET_KEY']

# Home route
get '/' do
  erb :index
end

# Signup page
get '/signup' do
  erb :signup
end
