// Import tools
const express = require('express');   
const cors = require('cors');         
require('dotenv').config();           
const app = express();                //create server instance
const PORT = process.env.PORT || 5000; 

// Middleware 
app.use(cors());                       // Allow frontend to talk to backend
app.use(express.json());               // Automatically parse JSON data from requests

// Routes – all the endpoints your API has
app.use('/api/auth', require('./routes/auth')); 
app.use('/api/profile', require('./routes/profile'));
app.use('/api/matches', require('./routes/matches'));

// Test route – check if server is alive
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'StudyBuddy API is running!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`StudyBuddy backend running on http://localhost:${PORT}`);
});