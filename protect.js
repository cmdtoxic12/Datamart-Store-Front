const auth = firebase.auth();

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}
