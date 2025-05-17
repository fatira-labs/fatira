import { Schema, model } from 'mongoose'

const groupSchema = new Schema({
    id: String,
    name: String
});

const Group = model('Group', groupSchema);
export default Group;