import mongoose from '../db';

export default mongoose.model(
    "Group",
    new mongoose.Schema({
        id: String,
        name: String
    })
);