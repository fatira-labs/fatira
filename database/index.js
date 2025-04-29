import mongoose from 'mongoose'

const mongoose = require('mongoose');
const User = require('./User');
const Expense = require('./Expense');

const mongoDB = 'mongodb://localhost:27017/fatiraDB';
mongoose.connect(mongoDB);

