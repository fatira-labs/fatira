// import express from "express";
// import User from "../User.js"
// import { PublicKey } from '@solana/web3.js';

// const router = express.Router();

// // user sign up route
// router.post("/signup", async (req, res) => {
//     try {
//         const {owner, name, username} = req.body;

//         if (!owner || !name || !username) {
//             return res.status(400).json({message: "Missing required fields"});
//         }

//         // Validate Solana public key
//         try {
//             new PublicKey(owner);
//         } catch (error) {
//             return res.status(400).json({message: "Invalid Solana public key"});
//         }

//         // Validate username format (3-20 chars, alphanumeric and underscore)
//         if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
//             return res.status(400).json({
//                 message: "Username must be 3-20 characters long and contain only letters, numbers, and underscores"
//             });
//         }

//         // Validate name length
//         if (name.length < 1 || name.length > 50) {
//             return res.status(400).json({
//                 message: "Name must be between 1 and 50 characters long"
//             });
//         }
        
//         const existingUser = await User.findOne({owner});
//         if (existingUser) {
//             return res.status(400).json({message: "User already exists"});
//         }

//         const sameUsername = await User.findOne({username});
//         if (sameUsername) {
//             return res.status(400).json({message: "Username already exists"});
//         }

//         const newUser = new User({owner, name, username, groups: []});
//         await newUser.save();
//         res.status(201).json({
//             message: "User created successfully",
//             user: {
//                 owner: newUser.owner,
//                 name: newUser.name,
//                 username: newUser.username,
//             }});
//     } catch (error) {
//         console.error('Error in signup:', error);
//         res.status(500).json({message: "Internal server error"});
//     }
// });

// router.post("/add-user", async (req, res) => {
//     try {
//         const {caller, groupId, user} = req.body;

//         if (!caller || !groupId || !user) {
//             return res.status(400).json({message: "Missing required fields"});
//         }

//         const userToAdd = await User.findOne({username: user});
//         if (!userToAdd) {
//             return res.status(400).json({message: "User not found"});
//         }
        
//         // find user
//         const callerUser = await User.findOne({username: caller});
//         if (!callerUser) {
//             return res.status(400).json({message: "Caller not found"});
//         }

//         if (userToAdd.groups.includes(groupId)) {
//             return res.status(400).json({message: "User already in group"});
//         }

//         try {
//             const isAdmin = await isGroupAdmin(groupId, callerUser.owner);
//             if (!isAdmin) {
//                 return res.status(400).json({message: "Caller is not group admin"});
//             }
//         } catch (isAdminError) {
//             console.error('Error checking group admin:', isAdminError);
//             res.status(500).json({message: "Failed to verify group admin status"});
//         }
        
//         // call solana program
//         try {
//             const { transaction, backendPublicKey } = await addUserToGroup(groupId, userToAdd.owner, callerUser.owner);
//             userToAdd.groups.push(groupId);
//             await userToAdd.save();
            
//             res.status(200).json({
//                 message: "User added to group onchain",
//                 transaction,
//                 backendPublicKey
//             });
//         } catch (solanaError) {
//             console.error('Error in adding user to group:', solanaError);
//             res.status(500).json({message: "Solana transaction failed"});
//         }

//     } catch (error) {
//         console.error('Error in adding user:', error);
//         res.status(500).json({message: "Internal server error"});
//     }
// });

// //TODO: ADD CREATE GROUP ROUTE

// export default router;