import express from "express";
import User from "../User.js"

const router = express.Router();

// user sign up route
router.post("/signup", async (req, res) => {
    try {
        const {owner, name, username} = req.body;

        if (!owner || !name || !username) {
            return res.status(400).json({message: "Missing required fields"});
        }
        
        const existingUser = await User.findOne({owner});
        if (existingUser) {
            return res.status(400).json({message: "User already exists"});
        }

        const sameUsername = await User.findOne({username});
        if (sameUsername) {
            return res.status(400).json({message: "Username already exists"});
        }

        const newUser = new User({owner, name, username, groups: []});
        await newUser.save();
        res.status(201).json({
            message: "User created succesfully",
            user: {
                owner: newUser.owner,
                name: newUser.name,
                username: newUser.username,
            }});
    } catch (error) {
        console.error('Error in signup:', error);
        res.status(500).json({message: "Internal server error"});
    }
});

export default router;