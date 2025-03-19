import mongoose from 'mongoose';
import request from 'supertest';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import app from '../server.js';
import Form from '../models/Form.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: new URL('../../../../.env', import.meta.url).pathname });

describe('Server Setup Tests', () => {
    beforeAll(async () => {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
    });

    afterAll(async () => {
        // Clean up and close connection
        await Form.deleteMany({});
        await mongoose.connection.close();
    });

    test('MongoDB Connection', async () => {
        expect(mongoose.connection.readyState).toBe(1); // 1 means connected
    });

    test('API Health Check', async () => {
        const response = await request(app)
            .get('/api/health')
            .expect(200);
        
        expect(response.body).toHaveProperty('status', 'ok');
    });

    test('Make.com Webhook Endpoint', async () => {
        const testData = {
            id: 'test-task-123',
            name: 'Test Lead',
            title: 'Test Title'
        };

        const response = await request(app)
            .post('/api/clickup-data')
            .send(testData)
            .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.form).toHaveProperty('id', 'test-task-123');
        expect(response.body.form).toHaveProperty('name', 'Test Lead');
        expect(response.body.form).toHaveProperty('phase', 'erstberatung');
    });

    test('CORS Configuration', async () => {
        const response = await request(app)
            .get('/api/health')
            .set('Origin', 'http://localhost:5173')
            .expect(200);

        expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
}); 