const firebaseConfig = {
  apiKey: "AIzaSyDp5gISv58AFGDqf1aAaJ-n6w-FSX8FMeY",
  authDomain: "fintelai.firebaseapp.com",
  projectId: "fintelai",
  storageBucket: "fintelai.firebasestorage.app",
  messagingSenderId: "623564993779",
  appId: "1:623564993779:web:59a8a38751675a6ffef386",
  measurementId: "G-JSTDT4PWFV"
};

function initializeFirebase() {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
}

function signInWithGoogleAndRedirect(redirectUrl = "app.html") {
  const provider = new firebase.auth.GoogleAuthProvider();
  return firebase.auth().signInWithPopup(provider)
    .then(() => {
      window.location.href = redirectUrl;
    })
    .catch(error => {
      console.error("Firebase login error:", error);
      alert("Sign-in failed. Check console for details.");
    });
}
