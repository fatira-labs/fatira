import mongoose from '../db';

export default mongoose.model(
    "Expense",
    new mongoose.Schema({
        group: String,
        name: String, 
        description: String,
        totalCost: Number,
        payee: String,
        payers: [String],
        amounts: [Number],
    })
);