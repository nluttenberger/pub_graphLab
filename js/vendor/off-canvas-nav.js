
function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
  document.getElementById("main").classList.add('offset-md-1');
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("main").classList.remove('offset-md-2');
}
