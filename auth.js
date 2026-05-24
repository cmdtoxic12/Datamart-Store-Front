function showToast(message, type = "success") {

  const toast = document.createElement("div");

  toast.className = `toast ${type}`;

  toast.textContent = message;

  document.getElementById("toastBox")
    .appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

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

let authMode = "login";

function setAuthMode(mode) {
  authMode = mode;

  const confirmPassword =
    document.getElementById("confirmPassword");

  const actionBtn =
    document.getElementById("authActionBtn");

  const subtitle =
    document.getElementById("authSubtitle");

  document.getElementById("authMessage").textContent = "";

  if (mode === "login") {
    confirmPassword.classList.add("hidden");
    actionBtn.textContent = "Login";
    actionBtn.onclick = login;
    subtitle.textContent = "Login to continue";

    document.getElementById("loginTab").classList.add("active");
    document.getElementById("signupTab").classList.remove("active");
  } else {
    confirmPassword.classList.remove("hidden");
    actionBtn.textContent = "Create Account";
    actionBtn.onclick = signup;
    subtitle.textContent = "Create your admin account";

    document.getElementById("signupTab").classList.add("active");
    document.getElementById("loginTab").classList.remove("active");
  }
}

function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth.signInWithRedirect(provider);
}

auth.getRedirectResult()
  .then((result) => {
    if (result.user) {
      window.location.href = "index.html";
    }
  })
  .catch((error) => {
    document.getElementById("authMessage").textContent = error.message;
  });
