const express = require("express");
const path = require("path");
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require("firebase/auth");
const { getDatabase, ref, get }= require("firebase/database");

const app = express();

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAVp5CtsglGVw5Zjdbbf_dJZpGdgoTkPSI",
    authDomain: "authentication-12298.firebaseapp.com",
    projectId: "authentication-12298",
    storageBucket: "authentication-12298.firebasestorage.app",
    messagingSenderId: "414945602397",
    appId: "1:414945602397:web:992285ca199707cd1956b4",
    measurementId: "G-F2YC2XWHBW"
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

// Routes
app.get('/', (req, res) => {
    res.redirect('/login');  // Redirect to login page 
});

// Login 
app.get('/login', (req, res) => {
    res.render('login', { message: ""});  // Render the login page
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;  

    try {
        // Try to sign in with the provided email and password
        await signInWithEmailAndPassword(auth, email, password);
        res.redirect('/dashboard');  // Redirect to dashboard if login is successful
    } catch (error) {
          // console.error("Login failed: ", error.message); 
          res.render('login', { message: "Login failed! Please check your email and password." });  // Display error message
        } 
});

// Signup 
app.get('/signup', (req, res) => {
    res.render('signup', { message: "" });  // Render the signup page
});


app.post('/signup', async (req, res) => {
    const { email, password } = req.body;  

    try {
       
        await createUserWithEmailAndPassword(auth, email, password);
        res.redirect('/login'); 
    } catch (error) {
        // console.error("Error creating user: ", error.message); 
        res.render('signup', { message: `Signup failed! Please try again` });  // Display error message
    }
});

// Dashboard
app.get("/dashboard", async (req, res) => {
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
  });

// Start Server
const port = 7000;
app.listen(port, () => {
    console.log(`Server running on Port: ${port}`); 
});
