// Add to server.js - Simple submission storage
const fs = require('fs');
const path = require('path');

// Store submissions in a JSON file
const submissionsFile = path.join(__dirname, 'submissions.json');

// Ensure submissions file exists
if (!fs.existsSync(submissionsFile)) {
    fs.writeFileSync(submissionsFile, '[]');
}

// Add this endpoint to your server.js
app.post('/api/submit-appointment', (req, res) => {
    try {
        const submission = {
            id: Date.now().toString(),
            submittedAt: new Date().toISOString(),
            ...req.body
        };

        // Read existing submissions
        const submissions = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));
        
        // Add new submission
        submissions.push(submission);
        
        // Write back to file
        fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2));
        
        // Send email notification (optional)
        console.log('📧 New submission received:', submission);
        
        res.json({ success: true, id: submission.id });
    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ error: 'Failed to save submission' });
    }
});

// Get submissions for admin
app.get('/api/submissions', (req, res) => {
    try {
        const submissions = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));
        res.json(submissions);
    } catch (error) {
        console.error('Get submissions error:', error);
        res.json([]);
    }
});

// Delete submission
app.delete('/api/submissions/:id', (req, res) => {
    try {
        const submissions = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));
        const filtered = submissions.filter(s => s.id !== req.params.id);
        fs.writeFileSync(submissionsFile, JSON.stringify(filtered, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Delete submission error:', error);
        res.status(500).json({ error: 'Failed to delete submission' });
    }
});
