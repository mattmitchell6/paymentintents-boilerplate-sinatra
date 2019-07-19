var elements = stripe.elements();

var card = elements.create('card', {
  hidePostalCode: true
});

card.mount('#card-element');

card.addEventListener('change', function(event) {
  var displayError = document.getElementById('card-errors');
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = '';
  }
});

var cardButton = document.getElementById('card-button');

cardButton.addEventListener('click', function(event) {
  var itemId = this.getAttribute("data-id")

  stripe.createPaymentMethod('card', card).then(function(result) {
    if (result.error) {
      // Show error in payment form
    } else {
      // Otherwise send paymentMethod.id to your server (see Step 2)
      fetch('/confirm_payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method_id: result.paymentMethod.id,
          item_id: itemId
        })
      }).then(function(result) {
        // Handle server response (see Step 3)
        result.json().then(function(json) {
          handleServerResponse(json);
        })
      });
    }
  });
});

function handleServerResponse(response) {
  if (response.error) {
    // Show error from server on payment form
  } else if (response.requires_action) {
    // Use Stripe.js to handle required card action
    stripe.handleCardAction(
      response.payment_intent_client_secret
    ).then(function(result) {
      if (result.error) {
        // Show error in payment form
      } else {
        // The card action has been handled
        // The PaymentIntent can be confirmed again on the server
        fetch('/confirm_payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_intent_id: result.paymentIntent.id
          })
        }).then(function(confirmResult) {
          return confirmResult.json();
        }).then(handleServerResponse);
      }
    });
  } else {
    // Show success message
    console.log("Success! Show message!");
    window.location.href = "/success?intent_id=" + response.intent_id
  }
}
