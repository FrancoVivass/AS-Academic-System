console.log("hola")

/*===== LOGIN SHOW and HIDDEN =====*/


console.log("hola")
function miFuncion() {
  alert('Función desde mi-script.js');
}

let prevScroll = window.pageYOffset;
window.onscroll = () => {
  let curScroll = window.pageYOffset;
  const headerElement = document.getElementsByClassName("header")[0];
  if (prevScroll > curScroll) {
    headerElement.style.top = "0";
  } else {
    headerElement.style.top = "-25vh";
  }
  prevScroll = curScroll;
};
// script.encabezado.js
// script.encabezado.js

document.addEventListener("DOMContentLoaded", function() {
  const menuButton = document.querySelector(".link-col-mobile");
  const closeButton = document.querySelector(".close-button p");
  const mobileOverlay = document.querySelector(".mobile-overlay");
  const mobileMenu = document.querySelector(".mobile-menu");

  menuButton.addEventListener("click", function() {
    mobileOverlay.classList.add("show");
    mobileMenu.classList.add("show");
  });

  closeButton.addEventListener("click", function() {
    mobileOverlay.classList.remove("show");
    mobileMenu.classList.remove("show");
  });

  // Close the menu when clicking outside the menu (on the overlay)
  mobileOverlay.addEventListener("click", function(event) {
    if (event.target === mobileOverlay) {
      mobileOverlay.classList.remove("show");
      mobileMenu.classList.remove("show");
    }
  });
});


