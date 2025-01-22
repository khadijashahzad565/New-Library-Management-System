
// Firebase Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, get, remove } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVp5CtsglGVw5Zjdbbf_dJZpGdgoTkPSI",
  authDomain: "authentication-12298.firebaseapp.com",
  projectId: "authentication-12298",
  storageBucket: "authentication-12298.firebasestorage.app",
  messagingSenderId: "414945602397",
  appId: "1:414945602397:web:992285ca199707cd1956b4",
  measurementId: "G-F2YC2XWHBW"
}

const app = initializeApp(firebaseConfig);
const db = getDatabase();

async function checkAdminStatus() {
    try {
        const userEmail = sessionStorage.getItem("userEmail"); 
        if (!userEmail) {
            console.warn("User email not found in session storage.");
            return false;
        }

        const adminEmailRef = ref(db, "Admins");
        const snapshot = await get(adminEmailRef);

        if (snapshot.exists()) {
            const adminEmails = Object.values(snapshot.val());
            return adminEmails.includes(userEmail); 
        } else {
            console.warn("No admin data found in the database.");
            return false;
        }
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}


async function displayBooks() {
    const bookTable = document.getElementById("book-table");
    const dbRef = ref(db, "Books");

  
    bookTable.innerHTML = `
        <div class="text-center my-5">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    try {
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
            const books = snapshot.val();

            // Reset the table content
            bookTable.innerHTML = `
                <thead class="table-dark">
                    <tr>
                        <th>Book Name</th>
                        <th>ISBN</th>
                        <th>Genre</th>
                        <th>Author</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;

            const tbody = bookTable.querySelector("tbody");

            Object.keys(books).forEach((key) => {
                const book = books[key];
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${book.BookName}</td>
                    <td>${book.ISBN}</td>
                    <td>${book.Genre}</td>
                    <td>${book.Author}</td>
                    <td>
                        <div class="d-flex flex-column flex-md-row gap-2">
                            <button class="btn btn-dark btn-sm" onclick="editBook('${key}')">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteBook('${key}')">Delete</button>
                        </div>
                    </td>
                `;

                tbody.appendChild(row);
            });
        } else {
            bookTable.innerHTML = `
                <div class="alert alert-info" role="alert">
                    No books available at the moment.
                </div>
            `;
        }
    } catch (error) {
        console.error("Error fetching books data:", error);
        alert("Failed to load books. Please try again later.");
    }
}


window.editBook = function (key) {
    window.location.href = `/dashboard?id=${key}`; 
};


window.deleteBook = async function (key) {
    try {
        const isAdmin = await checkAdminStatus(); 
        if (!isAdmin) {
            alert("Only admin has access to delete books.");
            return;
        }

        if (confirm("Are you sure you want to delete this book?")) {
            const bookRef = ref(db, `Books/${key}`);
            await remove(bookRef);
            alert("Book deleted successfully.");
            displayBooks(); 
        }
    } catch (error) {
        console.error("Error deleting book:", error);
        alert("An error occurred while deleting the book. Please try again.");
    }
};


window.onload = displayBooks;