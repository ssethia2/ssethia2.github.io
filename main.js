function main() {
    $(".title").hide();
    $(".text").hide();
    $(".bottom").hide();
    
    $(".title").fadeIn(1000);
    $(".text").fadeIn(3500);
    $(".bottom").fadeIn(3750);

    for (var i = 15; i <= document.getElementsByClassName("title name image").length; i += 15) {
        document.getElementsByClassName("title name image").wi
    }

    //$(".projects").hide();
    //$(".projects-button").on("click", function () {
    //    $(this).next().slideToggle(400);
    //    $(this).toggleClass("active");
    //    $(this).text("Projects Viewed");
    //});
}
$(document).ready(main);    