const books = [
    
    { id: 3, name: '1984', isbn: '9780451524935', genre: 'Dystopian', author: 'George Orwell' },
  ];
  
  function displayBooks() {
    const bookTable = document.getElementById('book-table');
   
    bookTable.innerHTML = `
      <tr>
        <th>Book Name</th>
        <th>ISBN</th>
        <th>Genre</th>
        <th>Author</th>
        <th>Actions</th>
      </tr>
    `;
    
    
    books.forEach(book => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${book.name}</td>
        <td>${book.isbn}</td>
        <td>${book.genre}</td>
        <td>${book.author}</td>
        <td>
          <button onclick="editBook(${book.id})">Edit</button>
          <button onclick="deleteBook(${book.id})">Delete</button>
        </td>
      `;
      bookTable.appendChild(row);
    });
  }
  
  function editBook(bookId) {
   
    window.location.href = `/dashboard?id=${bookId}`;
  }
  
  
  function deleteBook(bookId) {
    
    if (confirm('Are you sure you want to delete this book?')) {
      
      const bookIndex = books.findIndex(b => b.id === bookId);
      if (bookIndex > -1) {
        books.splice(bookIndex, 1);
        displayBooks();
      }
    }
  }
  
  window.onload = displayBooks;
  