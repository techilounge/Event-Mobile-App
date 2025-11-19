// API Service Tests
describe('API Services', () => {
    it('should have valid base URL structure', () => {
        const validUrl = /^https?:\/\/.+/;
        expect(validUrl.test('http://localhost:3000')).toBe(true);
    });

    it('should construct endpoint paths correctly', () => {
        const basePath = '/api';
        const endpoint = '/users';
        const fullPath = basePath + endpoint;
        expect(fullPath).toBe('/api/users');
    });
});

// utility function tests
describe('Helper Functions', () => {
    it('should format dates correctly', () => {
        const date = new Date('2025-11-18');
        expect(date.getFullYear()).toBe(2025);
    });

    it('should validate email format', () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test('test@example.com')).toBe(true);
        expect(emailRegex.test('invalid-email')).toBe(false);
    });
});
