// Import required tools
const express = require('express'); 
const bcrypt = require('bcryptjs'); // For hashing passwords
const db = require('../models/db'); // Database connection
const router = express.Router(); 

// When a student submits the registration form, this runs
router.post('/register', async (req, res) => {
    // Get the data from the request body (what the user typed)
    const { name, email, studentId, password } = req.body;

    // email domain name check
    if (!email.endsWith('@strathmore.edu')) {
        return res.status(400).json({ 
            message: 'Only @strathmore.edu email addresses are allowed.' 
        });
    }

    try {
        // duplicate account check
        const [existing] = await db.query(
            'SELECT * FROM STUDENT WHERE email = ?', 
            [email]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ 
                message: 'An account with this email already exists.' 
            });
        }

        // password hashing
        const hashedPassword = await bcrypt.hash(password, 10);

        // save student to database
        const [result] = await db.query(
            `INSERT INTO STUDENT 
            (name, email, hashed_password, student_id_number) 
            VALUES (?, ?, ?, ?)`,
            [name, email, hashedPassword, studentId]
        );

        // add a record to the VERIFICATION table (pending)
        await db.query(
            `INSERT INTO VERIFICATION 
            (student_id, student_id_number, verification_status) 
            VALUES (?, ?, ?)`,
            [result.insertId, studentId, 'pending']
        );

        // send success response
        res.status(201).json({ 
            message: 'Registration successful! Await admin verification to access matches.' 
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ 
            message: 'Server error. Please try again later.' 
        });
    }
});

module.exports = router;