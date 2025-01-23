import mongoose from "mongoose";

export const connection = () => {
    const options = {
        dbName: "Job_Portal",
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
    };

    mongoose.connect(process.env.MONGO_URI, options)
        .then(() => {
            console.log("Connected to DataBase");
        })
        .catch(error => {
            console.log(`Some error occurred: ${error}`);
        });

    // Handle connection errors
    mongoose.connection.on('error', (err) => {
        if (err.message.includes('ECONNRESET')) {
            console.log('Connection lost. Attempting to reconnect...');
            mongoose.connect(process.env.MONGO_URI, options);
        }
    });
}