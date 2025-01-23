const express = require("express");
const path = require("path");
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail } = require("firebase/auth");
const { getDatabase, ref, get, update } = require("firebase/database");
require("dotenv").config();
const app = express();

// Firebase Configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);

// Middleware
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Admin email
const adminEmail = process.env.ADMIN_EMAIL;

app.use((req, res, next) => {
    if (auth.currentUser) {
        req.user = auth.currentUser;
    }
    next();
});

// Routes
app.get('/', (req, res) => {
    res.redirect('/login');
});


/// Signup
app.get('/signup', (req, res) => {
    res.render('signup', { message: "" });
});

app.post('/signup', async (req, res) => {
    const { email, password, name, username } = req.body;
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
  
      const userRef = ref(database, 'users/' + uid);
      set(userRef, { email,name,});
  
      await sendEmailVerification(userCredential.user);
      res.render('signup', { message: "Signup successful! Please verify your email." });
    } catch (error) {
      res.render('signup', { message: `Signup failed! ${error.message}` });
    }
  });


// Login
app.get('/login', (req, res) => {
    res.render('login', { message: "" });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (email !== adminEmail && !userCredential.user.emailVerified) {
            return res.send(`<script>alert('Please verify your email before logging in.'); window.location.href = '/login';</script>`);
        }
        res.redirect('/profile'); // Redirect to profile after login
    } catch (error) {
        console.error("Login failed: ", error.message);
        res.send(`<script>alert('Login failed! ${error.message}'); window.location.href = '/login';</script>`);
    }
});



// Forgot Password
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { message: "" });
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        await sendPasswordResetEmail(auth, email);
        res.render('forgot-password', { message: "Password reset email sent! Please check your inbox." });
    } catch (error) {
        console.error("Error sending password reset email:", error.message);
        res.render('forgot-password', { message: "Failed to send reset email. " + error.message });
    }
});

// Admin Dashboard
app.get("/dashboard", async (req, res) => {
    if (req.user && req.user.email === adminEmail) {
        const bookRef = ref(database, "Books");
        try {
            const snapshot = await get(bookRef);
            const books = snapshot.exists() ? Object.values(snapshot.val()) : [];
            res.render("dashboard", { books: books, error: null });
        } catch (error) {
            console.error("Dashboard fetch error:", error.message);
            res.render("dashboard", { books: [], error: "Failed to load book data." });
        }
    } else {
        res.send('<script>alert("Unauthorized Access"); window.location.href = "/data";</script>');
    }
});

// Member Dashboard
app.get("/data", async (req, res) => {
    if (req.user) {
        const bookRef = ref(database, "Books");
        try {
            const snapshot = await get(bookRef);
            const books = snapshot.exists() ? Object.values(snapshot.val()) : [];
            res.render("data", { books: books, error: null });
        } catch (error) {
            console.error("Data fetch error:", error.message);
            res.render("data", { books: [], error: "Failed to load book data." });
        }
    } else {
        res.send('<script>alert("You must log in."); window.location.href = "/login";</script>');
    }
});

// Logout
app.get('/logout', (req, res) => {
    signOut(auth).then(() => {
        res.redirect('/login');
    }).catch((error) => {
        console.error("Logout error:", error.message);
        res.redirect('/data');
    });
});

// Profile route
app.get('/profile', (req, res) => {
    if (req.user) {
      const userRef = ref(database, 'users/' + req.user.uid);
      get(userRef)
        .then((snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            res.render('profile', { user: userData });
          } else {
            // Handle case where user data is not found in database
            res.render('profile', {
              user: { email: req.user.email, name: 'User', username: 'User' },
              error: "Profile data not found"
            });
          }
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
          res.render('profile', {
            user: { email: req.user.email, name: 'User', username: 'User' },
            error: "Error fetching profile data"
          });
        });
    } else {
      res.redirect('/login');
    }
  });

const port = process.env.PORT || 7000;
app.listen(port, () => {
    console.log(`Server running on Port: ${port}`);
});