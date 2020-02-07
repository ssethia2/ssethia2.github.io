function main() {
  $(".text").hide();

  $(".text").fadeIn(4000);

  $("#nav-home").click(function() {
    $([document.documentElement, document.body]).animate({
        scrollTop: $(".main").offset().top
    }, 1000);
  });

  $("#nav-about").click(function() {
    $([document.documentElement, document.body]).animate({
        scrollTop: $(".c_bio").offset().top
    }, 1000);
  });

  $("#nav-link").click(function() {
    $([document.documentElement, document.body]).animate({
        scrollTop: $(".resume").offset().top
    }, 1000);
  });
}

$(document).ready(main);
