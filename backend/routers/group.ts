import express from "express";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, SystemProgram, Transaction, Connection } from "@solana/web3.js"
import { createInitializeAccountInstruction, getMinimumBalanceForRentExemptAccount } from "@solana/spl-token";
import { IDL } from '../../program/target/idl/fatira.json';
let router = express.Router();

let connection = new Connection(process.env.RPC_URL);
let admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("../../../admin-keypair.json"))));
let wallet = new anchor.Wallet(admin);
let provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
let programId = new PublicKey("ftra545Ysk9H9HjvhfqXh5xP5PTQTC1KV3rk4AADXeC");
let program = new anchor.Program(idl, programId, provider);

router.post("/create", async (req, res) => {
	const { user, name, currency, tokenProgram } = req.body;

	let group = Keypair.generate();
	let escrow = Keypair.generate();
	let lamports = await getMinimumBalanceForRentExemptAccount(connection);
	let [escrowAuthority, escrowBump] = await PublicKey.findProgramAddress([Buffer.from("authority"), group.publicKey.toBuffer()], program.programId);

	let transaction = new Transaction();
	let { blockhash } = await connection.getLatestBlockhash("finalized");
	transaction.recentBlockhash = blockhash;
	transaction.feePayer = new PublicKey(user);
	
	transaction.add(
		SystemProgram.createAccount({
			fromPubkey: new PublicKey(user),
			newAccountPubkey: escrow.publicKey,
			lamports,
			space: 165,
			programId: new PublicKey(tokenProgram)
		}),
		createInitializeAccountInstruction(escrow.publicKey, new PublicKey(currency), escrowAuthority, new PublicKey(tokenProgram)),
		program.methods.createGroup().accounts({
			group: group.publicKey,
			payer: new PublicKey(user),
			currency: new PublicKey(currency),
			escrow: escrow.publicKey,
			admin: admin.publicKey,
			systemProgram: SystemProgram.programId
		}).instruction()
	);
	transaction.partialSign(admin, group, escrow);

	await (new Group({
        id: group.publicKey,
        name
    })).save();

	res.json({
		transaction: transaction.serialize({requireAllSignatures: false}).toString("base64")
	});
});