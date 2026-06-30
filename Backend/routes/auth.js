const express = require('express');      // Web framework for building APIs
const bcrypt = require('bcryptjs');       // password hashing library 
const jwt = require('jsonwebtoken');      // Creates tokens for login session
const db = require('../models/db');       // Db stuff
const router = express.Router();          // Creates a new router for our routes

// This runs when a student submits the registration form
router.post('/register', async (req, res) => {
    const { name, email, studentId, password } = req.body;

    // Check if email ends with @strathmore.edu
    if (!email.endsWith('@strathmore.edu')) {
        return res.status(400).json({ 
            message: 'Only @strathmore.edu email addresses are allowed.' 
        });
    }

    try {
        // Check if email already exists in the database
        const [existing] = await db.query(
            'SELECT * FROM STUDENT WHERE email = ?', 
            [email]
        );
        if (existing.length > 0) {
            return res.status(400).json({ 
                message: 'An account with this email already exists.' 
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the student to the STUDENT table
        const [result] = await db.query(
            `INSERT INTO STUDENT 
            (name, email, hashed_password, student_id_number) 
            VALUES (?, ?, ?, ?)`,
            [name, email, hashedPassword, studentId]
        );

        // Add a record to the VERIFICATION table with status 'pending'
        await db.query(
            `INSERT INTO VERIFICATION 
            (student_id, student_id_number, verification_status) 
            VALUES (?, ?, ?)`,
            [result.insertId, studentId, 'pending']
        );

        // Send success response back to the student
        res.status(201).json({ 
            message: 'Registration successful! Await admin verification to get your StudyBuddy.' 
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ 
            message: 'Server error. Please try again later.' 
        });
    }
});

// after logging in
router.post('/login', async (req, res) => {
    // Get the email and password from the request body
    const { email, password } = req.body;

    try {
        // Find the student by email in the STUDENT table
        const [rows] = await db.query(
            'SELECT * FROM STUDENT WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ 
                message: 'Invalid email or password.' 
            });
        }

        // when found it takes the students data
        const student = rows[0];

        // bcrypt.compare() checks if the plain text matches the hash
        const validPassword = await bcrypt.compare(password, student.hashed_password);
        if (!validPassword) {
            return res.status(401).json({ 
                message: 'Invalid email or password.' 
            });
        }

        // Check if the student has been verified by the admin
        const [verification] = await db.query(
            'SELECT verification_status FROM VERIFICATION WHERE student_id = ?',
            [student.student_id]
        );

        // If verification record exists and status is 'verified', set to true
        const isVerified = verification.length > 0 && verification[0].verification_status === 'verified';

        // Block login if not verified
        if (!isVerified) {
            return res.status(403).json({ 
                message: 'Your account is pending admin verification. Please wait for approval.' 
            });
        }

        // check for admin role
        let role = 'student';
        const [adminCheck] = await db.query(
            'SELECT * FROM ADMIN WHERE email = ?',
            [email]
        );
        if (adminCheck.length > 0) {
            role = 'admin';
        }

        // This generate a JWT token that proves the student is logged in for future requests
        const token = jwt.sign(
            { 
                id: student.student_id,          
                email: student.email,           
                name: student.name,              
                role: role,                      // Now uses the role we checked
                verified: isVerified             
            },
            process.env.JWT_SECRET,              // Secret key from .env file
            { expiresIn: '7d' }                  // Token expires in 7 days
        );

        // Send back the token and user info (without the password)
        res.json({
            message: 'Login successful!',
            token: token,                         // The JWT token for future requests
            user: {
                id: student.student_id,
                name: student.name,
                email: student.email,
                verified: isVerified
            }
        });

    } catch (err) {
        // If anything goes wrong, log the error and send a generic message
        console.error('Login error:', err);
        res.status(500).json({ 
            message: 'Server error. Please try again later.' 
        });
    }
});

module.exports = router;