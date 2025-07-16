// script.js
const circles = document.querySelectorAll(".circle");
circles.forEach((circle, index) => {
  circle.addEventListener("click", () => {
    alert(`Project details for milestone ${index + 1}`);
  });
});
