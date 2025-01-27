const express = require("express");
const path = require("path");
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail } = require("firebase/auth");
const { getDatabase, ref, get, set } = require("firebase/database");
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

  
  /// Catalog Route
app.get("/catalog", (req, res) => {
    const searchQuery = req.query.search || ""; 

   
    const filteredBooks = books.filter(book => {
        const searchQueryLower = searchQuery.toLowerCase(); 
        
        return (
            book.title.toLowerCase().includes(searchQueryLower) ||
            book.author.toLowerCase().includes(searchQueryLower) ||
            (book.ISBN && book.ISBN.toString().toLowerCase().includes(searchQueryLower)) 
        );
    });
    
    res.render("catalog", { books: filteredBooks, searchQuery }); 
});



// Book Detail Route
app.get('/book/:id', (req, res) => {
    const bookId = req.params.id;
    const book = books.find(b => b.id === bookId);

    if (book) {
        res.render('detail', { book });
    } else {
        res.status(404).send('Book not found');
    }
});

//  books data 
const books = [
    {
        id: "1",
        title: "Atomic Habits",
        author: "James Clear",
        cover: "https://images.squarespace-cdn.com/content/v1/638e80647a559f75a7adf183/9ff404ad-43bf-4557-8020-da9a0fd3c86e/645EFF54-A51F-4FF6-9E55-5CF39074CA4F.jpeg",
        description: "A practical guide to building good habits and breaking bad ones.",
        publisher: "Penguin Random House",
        price: 11.99,
        genre: "Self-Help",
        ISBN: "87456",
    },
    {
        id: "2",
        title: "Sapiens",
        author: "Yuval Noah Harari",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-w3-uPki72nA30-edF_RLGRLVemt73rAQmg&s",
        description: "A brief history of humankind and our impact on the world.",
        publisher: "Harper",
        price: 14.99,
        genre: "History",
          ISBN: "36956",
    },
    {
        id: "3",
        title: "Ikigai",
        author: "Héctor García",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTrO5dL3mThe9MCr5sRw7LraJ-hdRmA3jZFg&s",
        description: "A Japanese philosophy for finding purpose and happiness in life.",
        publisher: "Penguin Books",
        price: 10.99,
        genre: "Philosophy",
          ISBN: "36548",
    },
    {
        id: "4",
        title: "Outliers",
        author: "Malcolm Gladwell",
        cover: "https://amazingworkplaces.co/wp-content/uploads/2022/01/outliers-malcolm-gladwell-Book-Review-Image-amazing-workplaces.jpg",
        description: "Explores the factors behind high achievers and their success.",
        publisher: "Little, Brown and Company",
        price: 12.99,
        genre: "Psychology",
          ISBN: "23689",
    },
    {
        id: "5",
        title: "Grit",
        author: "Angela Duckworth",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjEpZ36a45WoaoodfbJmKfpekp78Jm3YDa7w&s",
        description: "The power of passion and perseverance in achieving success.",
        publisher: "Scribner",
        price: 13.99,
        genre: "Motivation",
          ISBN: "59834",
    },
    {
        id: "6",
        title: "Drive",
        author: "Daniel H. Pink",
        cover: "https://amazingworkplaces.co/wp-content/uploads/2024/11/Drive_The-Surprising-Truth-About-What-Motivates-Us_Daniel-H.-Pink.jpg",
        description: "What truly motivates us and drives human behavior.",
        publisher: "Riverhead Books",
        price: 14.50,
        genre: "Self-Help",
          ISBN: "35678",
    },
    {
        id: "7",
        title: "Quiet",
        author: "Susan Cain",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-xIoPTiFtYWnmaZ0yDxbx-NFCFPReAzd1Ew&s",
        description: "The power of introverts in a world that values extroversion.",
        publisher: "Crown Publishing Group",
        price: 15.99,
        genre: "Psychology",
          ISBN: "25945",
    },
    {
        id: "8",
        title: "Peak",
        author: "Anders Ericsson",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6T8lnz27U5KKuHTebO93_iiUUI7-jbgJLSQ&s",
        description: "Unveils the secrets of mastery and expert performance.",
        publisher: "Houghton Mifflin Harcourt",
        price: 14.99,
        genre: "Self-Help",
          ISBN: "24587",
    },
];

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on Port: ${port}`);
});