const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
    let userswithsamename = users.filter((user)=>{
    return user.username === username
  });
  if(userswithsamename.length > 0){
    return true;
  } else {
    return false;
  }
}

const authenticatedUser = (username,password)=>{ //returns boolean
    let validusers = users.filter((user)=>{
    return (user.username === username && user.password === password)
  });
  if(validusers.length > 0){
    return true;
  } else {
    return false;
  }
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
    const password = req.body.password;
    // Check if username or password is missing
    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in" });
    }
    // Authenticate user
    if (authenticatedUser(username, password)) {
        // Generate JWT access token
        let accessToken = jwt.sign({
            data: password
        }, 'access', { expiresIn: 60 * 60 });
        // Store access token and username in session
        req.session.authorization = {
            accessToken, username
        }
        return res.status(200).send("User successfully logged in");
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
// Obtener el ISBN del libro de los parámetros
  const isbn = req.params.isbn;
  
  // Obtener el nombre de usuario de la sesión
  const username = req.session.authorization?.username;

  if (!username) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  // Obtener la nueva reseña del cuerpo de la solicitud
  const { review } = req.body;

  // Verificar si el libro existe
  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Inicializar el objeto de reseñas si no existe
  if (!books[isbn].reviews) {
    books[isbn].reviews = {};
  }

  // Verificar si el usuario ya tiene una reseña para este libro
  if (books[isbn].reviews[username]) {
    // Modificar la reseña existente
    books[isbn].reviews[username] = review;
    return res.status(200).json({ message: "Review updated successfully" });
  } else {
    // Agregar una nueva reseña para el usuario
    books[isbn].reviews[username] = review;
    return res.status(200).json({ message: "Review added successfully" });
  }
});

//Task-9
regd_users.delete("/auth/review/:isbn", (req, res) => {
  try {
    const requestedIsbn = req.params.isbn;
    const username = req.session.authorization.username; // Retrieve username from session

    if (!username) {
      return res.status(401).json({ message: "Unauthorized" }); // Handle unauthorized access
    }

    const book = books[requestedIsbn];

    if (book) {
      if (book.reviews[username]) { // Check if a review exists for the user
        delete book.reviews[username]; // Delete the user's review
        res.json({ message: "Review deleted successfully" });
      } else {
        res.status(404).json({ message: "Review not found" }); // Handle review not found
      }
    } else {
      res.status(404).json({ message: "Book not found" }); // Handle book not found
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting review" }); // Handle unexpected errors
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
