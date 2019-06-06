// Button loading state
$("button").on("click", function(){
  loadingMsg = $(this).attr("data-loading");
  $(this).addClass('disabled');
  $(this).html("<i class='fas fa-spinner fa-spin'></i> " + loadingMsg);
});
