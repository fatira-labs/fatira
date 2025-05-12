import { Schema, model } from 'mongoose'

const userSchema = new Schema({
    owner: String, // address
    name: String,
    username: String,
    groups: [String], // group ids
});

const User = model('User', userSchema);
export default User;