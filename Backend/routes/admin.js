const express = require('express');
const db = require('../models/db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin'); // <-- NEW
const router = express.Router();

// Apply admin middleware to ALL routes in this file
// This means every route below requires a valid token + admin role
router.use(auth, admin);

// Returns a list of all students with their verification status
router.get('/students', async (req, res) => {
    try {
        const [students] = await db.query(
            `SELECT s.student_id, s.name, s.email, s.student_id_number, s.created_at,
                    v.verification_status, v.verified_date
            FROM STUDENT s
            LEFT JOIN VERIFICATION v ON s.student_id = v.student_id
            ORDER BY s.student_id`
        );

        res.json({
            count: students.length,
            students: students
        });

    } catch (err) {
        console.error('Admin get students error:', err);
        res.status(500).json({ 
            message: 'Server error. Please try again later.' 
        });
    }
});

// Verify students
router.put('/verify/:id', async (req, res) => {
    const studentId = req.params.id;

    try {
        // Check if student exists
        const [student] = await db.query(
            'SELECT * FROM STUDENT WHERE student_id = ?',
            [studentId]
        );

        if (student.length === 0) {
            return res.status(404).json({ 
                message: 'Student not found.' 
            });
        }

        // Update verification status
        await db.query(
            `UPDATE VERIFICATION 
            SET verification_status = 'verified', verified_date = CURDATE() 
            WHERE student_id = ?`,
            [studentId]
        );

        // Log this action
        await db.query(
            `INSERT INTO ADMIN_ACTIVITY_LOG (admin_id, action) 
            VALUES (?, ?)`,
            [req.user.id, `Verified student ID ${studentId}`]
        );

        res.json({ 
            message: `Student ID ${studentId} has been verified successfully.` 
        });

    } catch (err) {
        console.error('Admin verify error:', err);
        res.status(500).json({ 
            message: 'Server error. Please try again later.' 
        });
    }
});

//suspend students
router.put('/suspend/:id', async (req, res) => {
    const studentId = req.params.id;

    try {
        // Check if student exists
        const [student] = await db.query(
            'SELECT * FROM STUDENT WHERE student_id = ?',
            [studentId]
        );

        if (student.length === 0) {
            return res.status(404).json({ 
                message: 'Student not found.' 
            });
        }

        // Update verification status to 'suspended'
        await db.query(
            `UPDATE VERIFICATION 
            SET verification_status = 'suspended' 
            WHERE student_id = ?`,
            [studentId]
        );

        // Log this action
        await db.query(
            `INSERT INTO ADMIN_ACTIVITY_LOG (admin_id, action) 
            VALUES (?, ?)`,
            [req.user.id, `Suspended student ID ${studentId}`]
        );

        res.json({ 
            message: `Student ID ${studentId} has been suspended.` 
        });

    } catch (err) {
        console.error('Admin suspend error:', err);
        res.status(500).json({ 
            message: 'Server error. Please try again later.' 
        });
    }
});

// Permanently deletes a student account (use with caution)
router.delete('/delete/:id', async (req, res) => {
    const studentId = req.params.id;

    try {
        // Check if student exists
        const [student] = await db.query(
            'SELECT * FROM STUDENT WHERE student_id = ?',
            [studentId]
        );

        if (student.length === 0) {
            return res.status(404).json({ 
                message: 'Student not found.' 
            });
        }

        // Delete the student (cascade will delete related records)
        await db.query(
            'DELETE FROM STUDENT WHERE student_id = ?',
            [studentId]
        );

        // Log this action
        await db.query(
            `INSERT INTO ADMIN_ACTIVITY_LOG (admin_id, action) 
            VALUES (?, ?)`,
            [req.user.id, `Deleted student ID ${studentId}`]
        );

        res.json({ 
            message: `Student ID ${studentId} has been deleted permanently.` 
        });

    } catch (err) {
        console.error('Admin delete error:', err);
        res.status(500).json({ 
            message: 'Server error. Please try again later.' 
        });
    }
});

// get admin logs
router.get('/logs', async (req, res) => {
    try {
        const [logs] = await db.query(
            `SELECT al.log_id, al.action, al.timestamp, a.name AS admin_name
            FROM ADMIN_ACTIVITY_LOG al
            JOIN ADMIN a ON al.admin_id = a.admin_id
            ORDER BY al.timestamp DESC
            LIMIT 100`
        );

        res.json({
            count: logs.length,
            logs: logs
        });

    } catch (err) {
        console.error('Admin get logs error:', err);
        res.status(500).json({ 
            message: 'Server error. Please try again later.' 
        });
    }
});

module.exports = router;