function main() {
    $(".title").hide();
    $(".text").hide();
    $(".bottom").hide();
    
    $(".title").fadeIn(1000);
    $(".text").fadeIn(2500);
    $(".bottom").fadeIn(2750);
    
    function hasCollided(a, b) {
        var aRect = a.getBoundingClientRect();
        var bRect = b.getBoundingClientRect();

        return !(
            ((aRect.top + aRect.height) < (bRect.top)) ||
            (aRect.top > (bRect.top + bRect.height)) ||
            ((aRect.left + aRect.width) < bRect.left) ||
            (aRect.left > (bRect.left + bRect.width))
        );
    }

    //$(".projects").hide();
    //$(".projects-button").on("click", function () {
    //    $(this).next().slideToggle(400);
    //    $(this).toggleClass("active");
    //    $(this).text("Projects Viewed");
    //});
}
$(document).ready(main);    