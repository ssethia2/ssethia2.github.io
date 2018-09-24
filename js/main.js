function main() {
  $(".title").hide();
  $(".text").hide();
  
  $(".title").fadeIn(3500);
  $(".text").fadeIn(4000);
}

$(document).ready(main);