const express = require('express');
const db = require('../models/db');
const auth = require('../middleware/auth');
const router = express.Router();

// This returns the student's courses, availability, and preferences
router.get('/', auth, async (req, res) => {
    try {
        const studentId = req.user.id;

        // Get the student's courses
        const [courses] = await db.query(
            `SELECT c.course_code, c.course_name 
            FROM STUDENT_COURSES sc
            JOIN COURSES c ON sc.course_id = c.course_id
            WHERE sc.student_id = ?`,
            [studentId]
        );

        // Get the student's availability
        const [availability] = await db.query(
            'SELECT day_of_week, time_start, time_end FROM AVAILABILITY WHERE student_id = ?',
            [studentId]
        );

        // Get the student's preferences
        const [preferences] = await db.query(
            'SELECT study_environment, study_pace FROM PREFERENCES WHERE student_id = ?',
            [studentId]
        );

        // Send back the profile data
        res.json({
            courses: courses.map(c => c.course_code),
            availability: availability,
            preferences: preferences.length > 0 ? preferences[0] : null
        });

    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ 
            message: 'Server error. Please try again later.' 
        });
    }
});

// This updates the student's courses, availability, and preferences
router.put('/', auth, async (req, res) => {
    const studentId = req.user.id;
    const { courses, availability, preferences } = req.body;

    try {
        // Update courses
        // First, delete all existing courses for this student
        await db.query(
            'DELETE FROM STUDENT_COURSES WHERE student_id = ?',
            [studentId]
        );

        // Then, add the new courses
        if (courses && courses.length > 0) {
            for (const courseCode of courses) {
                // Check if the course exists in the COURSES table
                const [courseRow] = await db.query(
                    'SELECT course_id FROM COURSES WHERE course_code = ?',
                    [courseCode]
                );

                if (courseRow.length > 0) {
                    await db.query(
                        'INSERT INTO STUDENT_COURSES (student_id, course_id) VALUES (?, ?)',
                        [studentId, courseRow[0].course_id]
                    );
                }
            }
        }

        // Update availability
        await db.query(
            'DELETE FROM AVAILABILITY WHERE student_id = ?',
            [studentId]
        );

        // Then, add the new availability slots
        if (availability && availability.length > 0) {
            for (const slot of availability) {
                await db.query(
                    'INSERT INTO AVAILABILITY (student_id, day_of_week, time_start, time_end) VALUES (?, ?, ?, ?)',
                    [studentId, slot.day, slot.start, slot.end]
                );
            }
        }

        // Update preferences
        await db.query(
            'DELETE FROM PREFERENCES WHERE student_id = ?',
            [studentId]
        );

        // Add new preferences if provided
        if (preferences) {
            await db.query(
                'INSERT INTO PREFERENCES (student_id, study_environment, study_pace) VALUES (?, ?, ?)',
                [studentId, preferences.environment, preferences.pace]
            );
        }

        // Send success response
        res.json({ 
            message: 'Profile updated successfully!' 
        });

    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ 
            message: 'Server error. Please try again later.' 
        });
    }
});

module.exports = router;