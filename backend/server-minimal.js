const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Logging middleware
app.use((req, res, next) => {
    process.stderr.write(`⚡ REQUEST: ${req.method} ${req.path}\n`);
    next();
});

app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Minimal server is running!',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(port, '0.0.0.0', () => {
    process.stderr.write(`🚀 MINIMAL Server running on port ${port}\n`);
});
