import mongoose, { Schema, model, Decimal128 } from 'mongoose'
import User from './User.js'

const expenseSchema = new Schema({
    group: String, // group id
    name: String, 
    description: String,
    totalCost: Decimal128,
    payee: String, // user address
    payers: [String],
    amounts: [Decimal128],
});

const Expense = new model('Expense', expenseSchema);
export default Expense;