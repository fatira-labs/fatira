// import { Connection, PublicKey, Keypair } from '@solana/web3.js';
// import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
// import { IDL } from '../../program/target/idl/fatira.json';
// import { fs } from 'fs';
// import { path } from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const PROGRAM_ID = new PublicKey(ftra545Ysk9H9HjvhfqXh5xP5PTQTC1KV3rk4AADXeC);

// function loadBackendKeypair() {
//     try {
//         const keypairPath = path.join(__dirname, '../../program/target/deploy/fatira-keypair.json');
//         const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')));
//         return Keypair.fromSecretKey(secretKey);
//     } catch (error) {
//         console.error('Error loading backend keypair:', error);
//         throw error;
//     }
// }

// export async function createUpdateBalancesTransaction(groupPublicKey, totalCost, users, amounts) {
//     try {
//         const backendKeypair = loadBackendKeypair();

//         const wallet = {
//             publicKey: backendKeypair.publicKey,
//             signTransaction: async (tx) => {
//                 tx.partialSign(backendKeypair);
//                 return tx;
//             }
//         };

//         const provider = new AnchorProvider(
//             Connection,
//             wallet,
//             { commitment: 'confirmed' }
//         );

//         const program = new Program(IDL, PROGRAM_ID, provider);
//         const groupPubkey = new PublicKey(groupPublicKey);
//         const userPubkeys = users.map(user => new PublicKey(user));

//         const tx = await program.methods
//             .updateBalances(totalCost, userPubkeys, amounts)
//             .accounts({
//                 payer: backendKeypair.publicKey,
//                 group: groupPubkey,
//                 systemProgram: SystemProgram.programId,
//             }).
//             transaction();
        
//         const { blockhash } = await Connection.getLatestBlockhash();
//         tx.recentBlockhash = blockhash;
//         tx.feePayer = backendKeypair.publicKey;

//         tx.partialSign(backendKeypair);

//         const serializedTx = tx.serialize({
//             requireAllSignatures: false,
//             verifySignatures: true,
//         });

//         const base64Tx = serializedTx.toString('base64');

//         return {
//             transaction: base64Tx,
//             backendPublicKey: backendKeypair.publicKey.toString()
//         };

//     }
//     catch (error) {
//         console.error('Error creating update balances transaction:', error);
//         throw error;
//     }
// }

// export async function addUserToGroup(groupPublicKey, userPublicKey, callerPublicKey) {
//     try {
//         const backendKeypair = loadBackendKeypair();
//         const wallet = {
//             publicKey: backendKeypair.publicKey,
//             signTransaction: async (tx) => {
//                 tx.partialSign(backendKeypair);
//                 return tx;
//             }
//         };
//         const provider = new AnchorProvider(
//             Connection,
//             wallet,
//             { commitment: 'confirmed' }
//         );
//         const program = new Program(IDL, PROGRAM_ID, provider);
//         const groupPubkey = new PublicKey(groupPublicKey);
//         const userPubkey = new PublicKey(userPublicKey);
//         const callerPubkey = new PublicKey(callerPublicKey);

//         const tx = await program.methods
//             .add_user(userPubkey)
//             .accounts({
//                 group: groupPubkey,
//                 payer: callerPubkey,
//             }).transaction();

//         const { blockhash } = await Connection.getLatestBlockhash();
//         tx.recentBlockhash = blockhash;
//         tx.feePayer = callerPubkey;
//         tx.partialSign(backendKeypair);

//         const serializedTx = tx.serialize({
//             requireAllSignatures: false,
//             verifySignatures: true,
//         });

//         const base64Tx = serializedTx.toString('base64');

//         return {
//             transaction: base64Tx,
//             backendPublicKey: backendKeypair.publicKey.toString()
//         };
//     } catch (error) {
//         console.error('Error adding user to group:', error);
//         throw error;
//     }
// }

// export async function isGroupAdmin(groupPublicKey, userPublicKey) { 
//     try {
//         const backendKeypair = loadBackendKeypair();
//         const wallet = {
//             publicKey: backendKeypair.publicKey,
//             signTransaction: async (tx) => {
//                 tx.partialSign(backendKeypair);
//                 return tx;
//             }
//         };
//         const provider = new AnchorProvider(
//             Connection,
//             wallet,
//             { commitment: 'confirmed' }
//         );
//         const program = new Program(IDL, PROGRAM_ID, provider);
//         const groupPubkey = new PublicKey(groupPublicKey);
//         const userPubkey = new PublicKey(userPublicKey);

//         const groupAccount = await program.account.group.fetch(groupPubkey);

//         return groupAccount.balances.length > 0 && 
//             groupAccount.balances[0].owner.toString() === userPublicKey;

//     } catch (error) {
//         console.error('Error checking if user is group admin:', error);
//         throw error;
//     }
// }