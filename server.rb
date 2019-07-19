require 'sinatra'
require 'stripe'
require 'dotenv/load'
require 'awesome_print'

# enable :sessions
# set :session_secret, SecureRandom.hex(64)
use Rack::Session::Cookie, :key => 'rack.session',
                           :path => '/',
                           :secret => 'SecureRandom.hex(64)'

# Load keys from env variables
Stripe.api_key = ENV['SECRET_KEY']

items = [{
  :id => 1,
  :name => "The Office DVD Set",
  :img => "office-dvd.jpg",
  :amount => 20000,
  :color => "success"
}, {
  :id => 2,
  :name => "Skis",
  :img => "skis.jpg",
  :amount => 2000,
  :color => "primary"
}, {
  :id => 3,
  :name => "Water Purifier",
  :img => "water-purifier.jpg",
  :amount => 9000,
  :color => "info"
}]

# Home route
get '/' do
  @items = items
  erb :index
end

# Checkout page
get '/checkout' do
  @item = items.find {|item| item[:id] == params[:itemId].to_i}
  erb :checkout
end

# Confirm payment route
post '/confirm_payment' do
  data = JSON.parse(request.body.read.to_s)
  item = items.find {|item| item[:id] == data['item_id'].to_i}

  begin
    if data['payment_method_id']
      # Create the PaymentIntent
      intent = Stripe::PaymentIntent.create(
        payment_method: data['payment_method_id'],
        amount: item[:amount],
        description: "#{item[:name]} Purchase",
        currency: 'usd',
        confirmation_method: 'manual',
        confirm: true,
      )
    elsif data['payment_intent_id']
      intent = Stripe::PaymentIntent.confirm(data['payment_intent_id'])
    end
  rescue Stripe::CardError => e
    # Display error on client
    return [200, { error: e.message }.to_json]
  end

  return generate_payment_response(intent)
end

get '/success' do
  intentId = params[:intent_id]
  @paymentIntent = Stripe::PaymentIntent.retrieve(intentId)
  @item = items.find {|item| item[:amount] == @paymentIntent[:amount]}

  erb :success
end

get '/signup' do
  @setupIntent = Stripe::SetupIntent.create

  erb :signup
end

get '/confirm_payment_offsession' do
  @item = items.find {|item| item[:id] == params[:itemId].to_i}
  ap @item

  begin
    @paymentIntent = Stripe::PaymentIntent.create({
      amount: @item[:amount],
      currency: 'usd',
      payment_method_types: ['card'],
      customer: session[:customer].id,
      payment_method: session[:customer].payment_method,
      off_session: true,
      confirm: true,
    })
    ap @paymentIntent
  rescue Exception => error
    raise error.message
  end

  erb :success
end

post '/signup' do
  name = params[:cardholderName]
  paymentMethod = params[:paymentMethod]
  email = params[:email]

  # This creates a new Customer and attaches the PaymentMethod in one API call.
  customer = Stripe::Customer.create(
    name: name,
    payment_method: paymentMethod,
    email: email)
  paymentMethod = Stripe::PaymentMethod.list(customer: customer.id, type: "card").first.id
  customer[:payment_method] = paymentMethod
  session[:customer] = customer

  redirect '/'
end

get '/logout' do
  session.clear
  redirect '/'
end

def generate_payment_response(intent)
  if intent.status == 'requires_action' &&
      intent.next_action.type == 'use_stripe_sdk'
    # Tell the client to handle the action
    [200, {
      requires_action: true,
      payment_intent_client_secret: intent.client_secret
      }.to_json]
  elsif intent.status == 'succeeded'
    # The payment didn’t need any additional actions and completed!
    # Handle post-payment fulfillment
    [200, {
      success: true, intent_id: intent.id}.to_json]
  else
    # Invalid status
    return [500, {error: 'Invalid PaymentIntent status'}.to_json]
  end
end

def signed_up
  return session[:customer]
end
