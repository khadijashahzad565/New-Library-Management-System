const express = require("express");
const path = require("path");
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = require("firebase/auth");
const { getDatabase, ref, get, push, set, update } = require("firebase/database");

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

// Admin email (created manually in Firebase console)
const adminEmail = "admin@example.com";


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
        await createUserWithEmailAndPassword(auth, email, password);
        res.redirect('/login'); 
    } catch (error) {
        res.render('signup', { message: `Signup failed! Please try again` });  // Display error message
    }
});

// Login
app.get('/login', (req, res) => {
    res.render('login', { message: "" });  // Render the login page
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
       
        await signInWithEmailAndPassword(auth, email, password);

        
        if (email === adminEmail) {
            res.redirect('/data'); 
        } else {
            res.redirect('/data');  
        }
    } catch (error) {
        console.error("Login failed: ", error.message);
        res.render('login', { message: "Login failed! Please check your email and password." });  // Display error message
    }
});

// Admin Dashboard Route
app.get("/dashboard", async (req, res) => {
    if (req.user && req.user.email === adminEmail) {
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
    const bookRef = ref(database, "Books");
    try {
        const snapshot = await get(bookRef);
        const books = snapshot.exists() ? Object.values(snapshot.val()) : [];
        res.render("data", { books: books, error: null });
    } catch (error) {
        console.error("Data fetch error:", error.message);
        res.render("data", { books: [], error: "Failed to load book data. Please try again." });
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

// Start Server
const port = 9000;
app.listen(port, () => {
    console.log(`Server running on Port: ${port}`);
});


