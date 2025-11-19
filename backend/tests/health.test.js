const request = require('supertest');
const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.json({
        message: 'Backend server is running!',
        version: '1.0.0',
    });
});

describe('Health Check', () => {
    it('should return 200 OK', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('Backend server is running!');
    });
});
