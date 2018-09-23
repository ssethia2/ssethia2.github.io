function main() {
    $(".title").hide();
    $(".text").hide();
    
    $(".title").fadeIn(3500);
    $(".text").fadeIn(4000);

    myMove();

    function myMove() {
        var elem = document.getElementById("dot-1");   
        var pos = 0;
        var id = setInterval(frame, 5);
        function frame() {
          if (pos == 350) {
            clearInterval(id);
          } else {
            pos++; 
            elem.style.top = pos + 'px';
          }
        }
      }
}
$(document).ready(main);