const express = require("express");
const path = require("path");
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail} = require("firebase/auth");
const { getDatabase, ref, get } = require("firebase/database");
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

// Admin email (created manually in Firebase console)
const adminEmail = process.env.ADMIN_EMAIL;


app.use((req, res, next) => {
    if (auth.currentUser) {
        req.user = auth.currentUser;
    }
    next();
});

// Routes
app.get('/', (req, res) => {
    res.redirect('/login');  // Redirect to login page
});

// Signup
app.get('/signup', (req, res) => {
    res.render('signup', { message: "" });  // Render the signup page
});

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;  

    try {
 const userCredential = await createUserWithEmailAndPassword(auth, email, password);
 await sendEmailVerification(userCredential.user);
        res.render('signup', { message: "Signup successful! Please check your email to verify your account." });
    } catch (error) {
        res.render('signup', { message: `Signup failed! Please try again` });
    }
});

// Login
app.get('/login', (req, res) => {
    res.render('login', { message: "" });  // Render the login page
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
       
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        if (email !== process.env.ADMIN_EMAIL && !userCredential.user.emailVerified) {
            res.send(`<script>
                alert('Please verify your email before logging in.');
                window.location.href = '/login'; 
            </script>`);
        } else {
        
        if (email === adminEmail) {
            res.redirect('/data'); 
        } else {
            res.redirect('/data');  
        }
    }
    } catch (error) {
        console.error("Login failed: ", error.message);
        res.send(`<script>
            alert('Login failed! Please check your email and password.');
            window.location.href = '/login'; 
        </script>`);    }
});

// Forgot Password Route
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { message: "" });
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Send password reset email
        await sendPasswordResetEmail(auth, email);
        res.render('forgot-password', { message: "Password reset email sent! Please check your inbox." });
    } catch (error) {
        console.error("Error sending password reset email:", error.message);
        res.render('forgot-password', { message: "Failed to send reset email. " + error.message });
    }
});


// Admin Dashboard Route
app.get("/dashboard", async (req, res) => {
    if (req.user && req.user.email === process.env.ADMIN_EMAIL) {
        const bookRef = ref(database, "Books");
        try {
            const snapshot = await get(bookRef);
            const books = snapshot.exists() ? Object.values(snapshot.val()) : [];
            res.render("dashboard", { books: books, error: null });
        } catch (error) {
            console.error("Dashboard fetch error:", error.message);
            res.render("dashboard", {
                books: [],
                error: "Failed to store book data. Please try again.",
            });
        }
    } else {
        res.send('<script>alert("Only Admin has access"); window.location.href = "/data";</script>');
    }
});

// Member Dashboard Route
app.get("/data", async (req, res) => {
    if (req.user) {
    const bookRef = ref(database, "Books");
    try {
        const snapshot = await get(bookRef);
        const books = snapshot.exists() ? Object.values(snapshot.val()) : [];
        res.render("data", { books: books, error: null });
    } catch (error) {
        console.error("Data fetch error:", error.message);
        res.render("data", { books: [], error: "Failed to load book data. Please try again." });
    }
} else {
    res.send('<script>alert("You must log in to access this page."); window.location.href = "/login";</script>');
}
});

// Logout Route
app.get('/logout', (req, res) => {
    signOut(auth).then(() => {
        res.redirect('/login');  
    }).catch((error) => {
        console.error("Logout error:", error.message);
        res.redirect('/data');  
    });
});


const port = 3000;
app.listen(port, () => {
    console.log(`Server running on Port: ${port}`);
});


