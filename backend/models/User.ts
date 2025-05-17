import mongoose from '../db';

export default mongoose.model(
    "User",
    new mongoose.Schema({
        owner: String,
        name: String,
        username: String
    })
);