// Importing tools
const express = require('express');   
const cors = require('cors');         
require('dotenv').config();           

// Create the server
const app = express();                
const PORT = process.env.PORT || 5000; 

// Middleware – things that run on every request
app.use(cors());                       
app.use(express.json());               

// tester
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'StudyBuddy API is running!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 StudyBuddy backend running on http://localhost:${PORT}`);
});