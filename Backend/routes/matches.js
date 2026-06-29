const express = require('express');
const db = require('../models/db');
const auth = require('../middleware/auth');
const router = express.Router();

// This finds compatible StudyBuddies
router.get('/', auth, async (req, res) => {
    try {
        const studentId = req.user.id;

        // Get the logged-in student's profile (courses, availability, preferences)
        const [myCourses] = await db.query(
            'SELECT course_code FROM STUDENT_COURSES sc JOIN COURSES c ON sc.course_id = c.course_id WHERE sc.student_id = ?',
            [studentId]
        );

        const [myAvailability] = await db.query(
            'SELECT day_of_week, time_start, time_end FROM AVAILABILITY WHERE student_id = ?',
            [studentId]
        );

        const [myPreferences] = await db.query(
            'SELECT study_environment, study_pace FROM PREFERENCES WHERE student_id = ?',
            [studentId]
        );

        // If student hasn't set up their profile, return empty list
        if (myCourses.length === 0 || myAvailability.length === 0 || myPreferences.length === 0) {
            return res.json({
                message: 'Please complete your profile first.',
                matches: []
            });
        }

        // Get all other verified students (exclude the logged-in student)
        const [otherStudents] = await db.query(
            `SELECT s.student_id, s.name, s.email 
            FROM STUDENT s
            JOIN VERIFICATION v ON s.student_id = v.student_id
            WHERE v.verification_status = 'verified' AND s.student_id != ?`,
            [studentId]
        );

        if (otherStudents.length === 0) {
            return res.json({
                message: 'No other verified students found.',
                matches: []
            });
        }

        // For each student, calculate compatibility score
        const matches = [];

        for (const other of otherStudents) {
            // Get other student's courses
            const [otherCourses] = await db.query(
                'SELECT course_code FROM STUDENT_COURSES sc JOIN COURSES c ON sc.course_id = c.course_id WHERE sc.student_id = ?',
                [other.student_id]
            );

            // Get other student's availability
            const [otherAvailability] = await db.query(
                'SELECT day_of_week, time_start, time_end FROM AVAILABILITY WHERE student_id = ?',
                [other.student_id]
            );

            // Get other student's preferences
            const [otherPreferences] = await db.query(
                'SELECT study_environment, study_pace FROM PREFERENCES WHERE student_id = ?',
                [other.student_id]
            );

            // If other student hasn't completed profile, skip them
            if (otherCourses.length === 0 || otherAvailability.length === 0 || otherPreferences.length === 0) {
                continue;
            }

            // Calculate compatibility score
            let score = 0;

            // CRITERION 1: Course overlap (max 50 points) - MOST IMPORTANT
            const myCourseCodes = myCourses.map(c => c.course_code);
            const otherCourseCodes = otherCourses.map(c => c.course_code);
            const commonCourses = myCourseCodes.filter(c => otherCourseCodes.includes(c));
            score += Math.min(commonCourses.length * 25, 50);

            // CRITERION 2: Availability overlap (max 30 points) - MEDIUM IMPORTANCE
            let availabilityMatch = false;
            for (const mySlot of myAvailability) {
                for (const otherSlot of otherAvailability) {
                    if (mySlot.day_of_week === otherSlot.day_of_week) {
                        // Check if time ranges overlap
                        const myStart = mySlot.time_start;
                        const myEnd = mySlot.time_end;
                        const otherStart = otherSlot.time_start;
                        const otherEnd = otherSlot.time_end;
                        if (myStart < otherEnd && otherStart < myEnd) {
                            availabilityMatch = true;
                            break;
                        }
                    }
                }
                if (availabilityMatch) break;
            }
            if (availabilityMatch) score += 30;

            // CRITERION 3: Preference alignment (max 20 points) - LEAST IMPORTANT
            const myPref = myPreferences[0];
            const otherPref = otherPreferences[0];
            if (myPref.study_environment === otherPref.study_environment) score += 12;
            if (myPref.study_pace === otherPref.study_pace) score += 8;

            // Only include students with at least some compatibility
            if (score > 0) {
                matches.push({
                    id: other.student_id,
                    name: other.name,
                    email: other.email,
                    common_courses: commonCourses,
                    compatibility_score: Math.min(score, 100),
                    availability: otherAvailability
                });
            }
        }

        // Sort matches by compatibility score (highest first)
        matches.sort((a, b) => b.compatibility_score - a.compatibility_score);

        // Return the ranked list
        res.json({
            message: `Found ${matches.length} compatible study partner(s)`,
            matches: matches
        });

    } catch (err) {
        console.error('Matching error:', err);
        res.status(500).json({
            message: 'Server error. Please try again later.'
        });
    }
});

// ============================================
// SEND CONNECTION REQUEST – POST /api/matches/request
// ============================================
// This runs when a student clicks "Send Request" on a match
router.post('/request', auth, async (req, res) => {
    const studentId = req.user.id;
    const { student_id: targetId } = req.body;

    // Make sure we got a student ID
    if (!targetId) {
        return res.status(400).json({ message: 'Student ID is required.' });
    }

    // Can't send a request to yourself
    if (parseInt(targetId) === studentId) {
        return res.status(400).json({ message: 'You cannot send a request to yourself.' });
    }

    try {
        // Check if the target student exists and is verified
        const [targetStudent] = await db.query(
            `SELECT s.student_id, v.verification_status 
             FROM STUDENT s
             JOIN VERIFICATION v ON s.student_id = v.student_id
             WHERE s.student_id = ?`,
            [targetId]
        );

        if (targetStudent.length === 0) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        if (targetStudent[0].verification_status !== 'verified') {
            return res.status(400).json({ message: 'This student is not yet verified.' });
        }

        // Check if a match already exists between these two students
        // IMPORTANT: MATCH is a reserved word – wrap in backticks
        const [existing] = await db.query(
            `SELECT * FROM \`MATCH\` 
             WHERE (student_id_1 = ? AND student_id_2 = ?) 
                OR (student_id_1 = ? AND student_id_2 = ?)`,
            [studentId, targetId, targetId, studentId]
        );

        if (existing.length > 0) {
            const status = existing[0].status;
            if (status === 'pending') {
                return res.status(400).json({ message: 'A request has already been sent.' });
            } else if (status === 'accepted') {
                return res.status(400).json({ message: 'You are already matched with this student.' });
            } else if (status === 'rejected') {
                return res.status(400).json({ message: 'This request was rejected.' });
            }
        }

        // Insert the match request – wrap MATCH in backticks
        await db.query(
            `INSERT INTO \`MATCH\` (student_id_1, student_id_2, status, request_date) 
             VALUES (?, ?, ?, CURDATE())`,
            [studentId, targetId, 'pending']
        );

        res.status(201).json({ 
            message: 'Connection request sent successfully!' 
        });

    } catch (err) {
        console.error('Send request error:', err);
        res.status(500).json({ 
            message: 'Server error. Please try again later.' 
        });
    }
});

module.exports = router;