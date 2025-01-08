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
        res.redirect('/data');  // Redirect to dashboard if login is successful
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


// Data Page
app.get('/data', async (req, res) => {
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

app.get("/dashboard/add", (req, res) => {
    res.render("dashboard", { book: null });
});

app.post("/dashboard/add", async (req, res) => {
    const { name, isbn, genre, author } = req.body;
    try {
        const newBookRef = push(ref(database, "Books"));
        await set(newBookRef, { name, isbn, genre, author });
        res.redirect("/data");
    } catch (error) {
        console.error("Add book error:", error.message);
        res.status(500).send("Failed to add book. Please try again.");
    }
});

// Edit Book Route
app.get("/dashboard/edit/:id", async (req, res) => {
    const bookId = req.params.id;
    const bookRef = ref(database, `Books/${bookId}`);
    try {
        const snapshot = await get(bookRef);
        const book = snapshot.val();
        if (book) {
            res.render("dashboard", { book: { id: bookId, ...book } });
        } else {
            res.redirect("/data");
        }
    } catch (error) {
        console.error("Edit fetch error:", error.message);
        res.redirect("/data");
    }
});

// Update Book Route
app.post("/update-book/:id", async (req, res) => {
    const bookId = req.params.id;
    const { name, isbn, genre, author } = req.body;
    const bookRef = ref(database, `Books/${bookId}`);
    try {
        await update(bookRef, { name, isbn, genre, author });
        res.redirect("/data");
    } catch (error) {
        console.error("Update book error:", error.message);
        res.status(500).send("Failed to update book. Please try again.");
    }
});

// Logout Route
app.get('/logout', (req, res) => {
    auth.signOut()
        .then(() => {
            res.redirect('/signup');
        }); 
});


// Start Server
const port = 9000;
app.listen(port, () => {
    console.log(`Server running on Port: ${port}`); 
});
