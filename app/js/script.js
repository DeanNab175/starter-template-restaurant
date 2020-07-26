
$(document).ready(function(){
    console.log("test");
    //$('.carousel').carousel();
    $(".owl-carousel").owlCarousel({
        items: 1,
        autoplay: true,
        loop: true,
        nav: true
    });
});