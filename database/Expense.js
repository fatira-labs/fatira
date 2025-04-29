const mongoose = require('mongoose');

new expense = mongoose.Schema({
    group: String,
    name: String,
    description: String,
    total_cost: Number,
    payee: User,
    payers: [User],
    amounts: [Number],
});