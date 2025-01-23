// Firebase Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAVp5CtsglGVw5Zjdbbf_dJZpGdgoTkPSI",
    authDomain: "authentication-12298.firebaseapp.com",
    databaseURL: "https://authentication-12298-default-rtdb.firebaseio.com",
    projectId: "authentication-12298",
    storageBucket: "authentication-12298.firebaseapp.com",
    messagingSenderId: "414945602397",
    appId: "1:414945602397:web:992285ca199707cd1956b4",
    measurementId: "G-F2YC2XWHBW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth();


const errorMessage = document.getElementById("error-message");


function fetchUserData(uid) {
    const dbRef = ref(database, `users/${uid}`);
    onValue(dbRef, (snapshot) => {
        tableBody.innerHTML = ""; 
        if (snapshot.exists()) {
            const user = snapshot.val();
            const row = `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.username}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML("beforeend", row);
        } else {
            showError("No data available for this user!");
        }
    }, (error) => {
        showError(`Error: ${error.message}`);
    });
}

// Function to display error message
function showError(message) {
    errorMessage.classList.remove("d-none");
    errorMessage.textContent = message;
}

// Check authentication state
onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user); 
    if (user) {
        console.log("User is logged in:", user); 
        
        const userRef = ref(database, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            if (!snapshot.exists()) {
                
                set(userRef, {
                    username: user.displayName || 'Default Username',
                    name: user.displayName || 'Default Name'
                });
            }
        });
        fetchUserData(user.uid);
    } else {
        console.log("No user is logged in."); 
        showError("No user is logged in. Please log in to view data.");
    }
});
