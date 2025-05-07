import { Schema, model } from 'mongoose'

const userSchema = new Schema({
    owner: String, // address
    name: String,
    username: String,
    groups: [String], // group ids
});
userSchema.methods.addGroup = function addGroup(groupId) {
    if (!this.groups.includes(groupId)) {
        this.groups.push(groupId);
        // send onchain transaction to add user to group 
    }
}
userSchema.methods.removeGroup = function removeGroup(groupId) {
    const index = this.groups.indexOf(groupId);
    if (index > -1) {
        // check if balance is 0
        this.groups.splice(index, 1);
    }
}

const User = model('User', userSchema);
export default User;