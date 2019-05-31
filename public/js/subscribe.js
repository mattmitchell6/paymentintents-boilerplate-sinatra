var elements = stripe.elements();

var style = {
  base: {
    color: '#32325d',
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '18px',
    '::placeholder': {
      color: '#999'
    },
    ':-webkit-autofill': {
      color: '#e39f48',
    },
  },
  invalid: {
    color: '#fa755a',
    '::placeholder': {
      color: '#FFCCA5',
    },
    iconColor: '#fa755a'
  }
};

var card = elements.create('card', {style: style});

card.mount('#card-element');

// Handle real-time validation errors from the card Element.
card.addEventListener('change', function(event) {
  var displayError = document.getElementById('card-errors');
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = '';
  }
});

var form = document.getElementById('payment-form');

// Handle card form submission
form.addEventListener('submit', function(event) {
  event.preventDefault();

  // Disable the button
  var linkButton = document.getElementById('btn-pay');
  linkButton.disabled = true;
  linkButton.innerHTML = "<i class='fa fa-spinner fa-spin'></i> Saving payment information...";

  stripe.createSource(card).then(function(result) {
    if (result.error) {
      // Inform the user if there was an error.
      var errorElement = document.getElementById('card-errors');
      errorElement.textContent = result.error.message;
      // Enable the button
      linkButton.disabled = false;
      linkButton.innerHTML = "Save payment information";
    } else {
      // Attach the token to the form and submit
      document.getElementById('source').value = result.source.id;
      form.submit();
    }
  });
});
