import mongoose from 'mongoose';

async function connectDB() {
    const maxRetries = 5;
    const retryDelay = 5000; // 5 seconds
    let retries = 0;
    let connected = false;

    while (!connected && retries < maxRetries) {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                minPoolSize: 5,
                retryWrites: true,
                w: 'majority'
            });

            console.log(`MongoDB Connected: ${mongoose.connection.host}`);
            connected = true;

            // Handle connection events
            mongoose.connection.on('error', err => {
                console.error('MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.log('MongoDB disconnected');
            });

            mongoose.connection.on('reconnected', () => {
                console.log('MongoDB reconnected');
            });

            return true;
        } catch (error) {
            retries++;
            console.error(`MongoDB connection attempt ${retries} failed:`, error.message);
            
            if (retries === maxRetries) {
                console.error('Max retries reached. Exiting...');
                process.exit(1);
            }

            console.log(`Retrying in ${retryDelay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}

export default connectDB; 