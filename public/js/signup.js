var elements = stripe.elements();

var cardElement = elements.create('card');
cardElement.mount('#card-element', {
  hidePostalCode: true
});

var cardholderName = document.getElementById('cardholder-name');
var cardButton = document.getElementById('card-button');
var clientSecret = cardButton.dataset.secret;

cardButton.addEventListener('click', function(event) {
  event.preventDefault();

  stripe.handleCardSetup(
    clientSecret, cardElement, {
      payment_method_data: {
        billing_details: {name: cardholderName.value}
      }
    }
  ).then(function(result) {
    if (result.error) {
      // Display error.message in your UI.
    } else {
      // The setup has succeeded. Display a success message.
      console.log(result.setupIntent.payment_method);
      // Insert the intent ID into the form so it gets submitted to the server
      var form = document.getElementById('savecard-form');
      var hiddenInput = document.createElement('input');
      hiddenInput.setAttribute('type', 'hidden');
      hiddenInput.setAttribute('name', 'paymentMethod');
      hiddenInput.setAttribute('value', result.setupIntent.payment_method);
      form.appendChild(hiddenInput);

      // Submit the form
      form.submit();
    }
  });
});
