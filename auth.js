firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

function signup() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch(error => {
      document.getElementById("authMessage").textContent = error.message;
    });
}

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch(error => {
      document.getElementById("authMessage").textContent = error.message;
    });
}

function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth.signInWithPopup(provider)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch(error => {
      document.getElementById("authMessage").textContent = error.message;
    });
}
