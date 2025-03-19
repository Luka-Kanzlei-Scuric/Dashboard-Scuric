export default {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    setupFiles: ['dotenv/config'],
    verbose: true,
    testTimeout: 10000,
    transform: {}
}; 