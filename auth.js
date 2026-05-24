firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

function signup() {

  const email =
    document.getElementById("email")
    .value
    .trim();

  const password =
    document.getElementById("password")
    .value;

  const confirmPassword =
    document.getElementById("confirmPassword")
    .value;

  const authMessage =
    document.getElementById("authMessage");

  authMessage.textContent = "";

  if (password.length < 6) {

    authMessage.textContent =
      "Password must be at least 6 characters.";

    return;
  }

  if (password !== confirmPassword) {

    authMessage.textContent =
      "Passwords do not match.";

    return;
  }

  auth.createUserWithEmailAndPassword(
    email,
    password
  )

  .then(() => {

    showToast(
      "Account created successfully ✅"
    );

    window.location.href = "index.html";
  })

  .catch(error => {

    authMessage.textContent =
      error.message;
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
