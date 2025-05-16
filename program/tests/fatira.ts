import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError, BN } from "@coral-xyz/anchor";
import { Fatira } from "../target/types/fatira";
import fs from "fs";
import os from "os";
import { assert } from "chai";
import { Token, TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, createSetAuthorityInstruction, AuthorityType, getAccount } from "@solana/spl-token";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

describe("fatira", () => {
	let provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	let program = anchor.workspace.fatira as Program<Fatira>;

	let payer = provider.wallet as anchor.Wallet;
	let admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(`${os.homedir()}/admnewKmeGHkU1ZM8kKaPfunvV4GPmZUAfQ48zNA6fL.json`))));
	let groupKey: PublicKey;
	let groupAccount: anchor.web3.AccountInfo<Buffer>;

	let mint: PublicKey;
	let payerAccount: PublicKey;
	let escrowAccount: PublicKey;
	let fakeEscrowAccount: PublicKey;
	let groupSigner: Keypair;
	let group: PublicKey;
	let user: Keypair;

	before(async () => {
		await provider.connection.confirmTransaction(
			await provider.connection.requestAirdrop(admin.publicKey, LAMPORTS_PER_SOL)
		)

		user = Keypair.generate();
		groupSigner = Keypair.generate();
		group = groupSigner.publicKey;
		mint = await createMint(provider.connection, admin, admin.publicKey, null, 0);
		let [escrowAuthority, escrowBump] = await PublicKey.findProgramAddress([Buffer.from("authority"), group.toBuffer()], program.programId);

		payerAccount = await createAccount(provider.connection, payer.payer, mint, payer.publicKey);

		let temporaryOwner = Keypair.generate();
		let fakeTemporaryOwner = Keypair.generate();
		escrowAccount = await createAccount(provider.connection, payer.payer, mint, temporaryOwner.publicKey);
		fakeEscrowAccount = await createAccount(provider.connection, payer.payer, mint, fakeTemporaryOwner.publicKey);
		let transferAuthority = new Transaction().add(createSetAuthorityInstruction(
			escrowAccount,
			temporaryOwner.publicKey,
			AuthorityType.AccountOwner,
			escrowAuthority,
			[],
			TOKEN_PROGRAM_ID
		));
		await sendAndConfirmTransaction(provider.connection, transferAuthority, [payer.payer, temporaryOwner], { commitment: "confirmed" });

		await mintTo(provider.connection, admin, mint, payerAccount, admin, 1000);
	});

	it("Fails to create a group with invalid escrow", async () => {
		try {
			await program.methods.createGroup().accounts({
				group,
				payer: payer.publicKey,
				currency: mint,
				escrow: fakeEscrowAccount,
				admin: admin.publicKey,
				systemProgram: SystemProgram.programId
			}).signers([admin, groupSigner]).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "InconsistentEscrowOwner");
		}
	});

	it("Fails to create a group with invalid admin keypair", async () => {
		let fakeAdmin = Keypair.generate();

		try {
			await program.methods.createGroup().accounts({
				group,
				payer: payer.publicKey,
				currency: mint,
				escrow: escrowAccount,
				admin: fakeAdmin.publicKey,
				systemProgram: SystemProgram.programId
			}).signers([fakeAdmin, groupSigner]).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "Unauthorized");
		}
	});

	it("Creates a group", async () => {
		await program.methods.createGroup().accounts({
			group,
			payer: payer.publicKey,
			currency: mint,
			escrow: escrowAccount,
			admin: admin.publicKey,
			systemProgram: SystemProgram.programId
		}).signers([admin, groupSigner]).rpc();

		let groupData = await program.account.group.fetch(group);
		assert.ok(groupData.currency.equals(mint));
		assert.ok(groupData.escrow.equals(escrowAccount));
		assert.equal(groupData.balances.length, 1);
		assert.ok(groupData.balances[0].user.equals(payer.publicKey));
	});

	it("Fails to add a user to a group without authorization", async () => {
		try {
			await program.methods.addUser(user.publicKey).accounts({
				group,
				payer: user.publicKey
			}).signers([user]).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "UnauthorizedAdd");
		}
	});

	it("Adds a user to a group", async () => {
		await program.methods.addUser(user.publicKey).accounts({
			group,
			payer: payer.publicKey
		}).rpc();

		let groupData = await program.account.group.fetch(group);
		assert.ok(groupData.balances[1].user.equals(user.publicKey));
		assert.equal(groupData.balances[1].approved, false);
	});

	it("Fails to add a user already in a group", async () => {
		try {
			await program.methods.addUser(user.publicKey).accounts({
				group,
				payer: payer.publicKey
			}).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "UserAlreadyExists");
		}
	});

	it("Fails to transfer admin without approval", async () => {
		try {
			await program.methods.transferAdmin(user.publicKey).accounts({
				group,
				payer: payer.publicKey
			}).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "UserNotApproved");
		}
	});

	it("Approves a user in a group", async () => {
		await program.methods.approveUser().accounts({
			group,
			payer: user.publicKey
		}).signers([user]).rpc();

		let groupData = await program.account.group.fetch(group);
		assert.equal(groupData.balances[1].approved, true);
	});

	it("Fails to transfer admin without authorization", async () => {
		try {
			await program.methods.transferAdmin(user.publicKey).accounts({
				group,
				payer: user.publicKey
			}).signers([user]).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "UnauthorizedTransfer");
		}
	});

	it("Transfers admin in a group", async () => {
		await program.methods.transferAdmin(user.publicKey).accounts({
			group,
			payer: payer.publicKey
		}).rpc();

		let groupData = await program.account.group.fetch(group);
		assert.ok(groupData.balances[0].user.equals(user.publicKey));
		assert.ok(groupData.balances[1].user.equals(payer.publicKey));

		await program.methods.transferAdmin(payer.publicKey).accounts({
			group,
			payer: user.publicKey
		}).signers([user]).rpc();

		groupData = await program.account.group.fetch(group);
		assert.ok(groupData.balances[0].user.equals(payer.publicKey));
		assert.ok(groupData.balances[1].user.equals(user.publicKey));
	});

	it("Adds an expense", async () => {
		await program.methods.updateBalances([payer.publicKey], [new BN(2)]).accounts({
			group,
			payer: user.publicKey,
			admin: admin.publicKey
		}).signers([admin, user]).rpc();

		let groupData = await program.account.group.fetch(group);
		assert.equal(groupData.balances[0].balance, -2);
		assert.equal(groupData.balances[1].balance, 2);
	});

	it("Adds another expense", async () => {
		await program.methods.updateBalances([payer.publicKey], [new BN(3)]).accounts({
			group,
			payer: user.publicKey,
			admin: admin.publicKey
		}).signers([admin, user]).rpc();

		let groupData = await program.account.group.fetch(group);
		assert.equal(groupData.balances[0].balance, -5);
		assert.equal(groupData.balances[1].balance, 5);
	});

	it("Adds a self-expense", async () => {
		await program.methods.updateBalances([payer.publicKey], [new BN(10)]).accounts({
			group,
			payer: payer.publicKey,
			admin: admin.publicKey
		}).signers([admin]).rpc();

		let groupData = await program.account.group.fetch(group);
		assert.equal(groupData.balances[0].balance, -5);
		assert.equal(groupData.balances[1].balance, 5);
	});

	it("Fails to add an expense for a user not in the group", async () => {
		let dummyKeypair = Keypair.generate();

		try {
			await program.methods.updateBalances([dummyKeypair.publicKey], [new BN(10)]).accounts({
				group,
				payer: payer.publicKey,
				admin: admin.publicKey
			}).signers([admin]).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "UserDoesNotExist");
		}
	});

	it("Fails to add an expense with invalid admin keypair", async () => {
		let fakeAdmin = Keypair.generate();

		try {
			await program.methods.updateBalances([user.publicKey], [new BN(5)]).accounts({
				group,
				payer: payer.publicKey,
				admin: fakeAdmin.publicKey
			}).signers([fakeAdmin]).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "Unauthorized");
		}
	});

	it("Fails to remove a user with a non-zero balance", async () => {
		try {
			await program.methods.removeUser(user.publicKey).accounts({
				group,
				payer: payer.publicKey
			}).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "UserBalanceNonZero");
		}
	});

	it("Fails to withdraw from an empty escrow", async () => {
		let [escrowAuthority, escrowBump] = await PublicKey.findProgramAddress([Buffer.from("authority"), group.toBuffer()], program.programId);
			
		try {
			await program.methods.withdraw(new BN(5)).accounts({
				group,
				recipient: payerAccount,
				escrow: escrowAccount,
				escrowAuthority,
				payer: user.publicKey,
				tokenProgram: TOKEN_PROGRAM_ID
			}).signers([user]).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "InsufficientEscrowBalance");
		}
	});

	it("Deposits to the escrow", async () => {
		let initialPayerBalance = (await getAccount(provider.connection, payerAccount)).amount;
		let initialEscrowBalance = (await getAccount(provider.connection, escrowAccount)).amount;

		await program.methods.deposit(new BN(5)).accounts({
			group,
			sender: payerAccount,
			escrow: escrowAccount,
			payer: payer.publicKey,
			tokenProgram: TOKEN_PROGRAM_ID
		}).rpc();

		let finalPayerBalance = (await getAccount(provider.connection, payerAccount)).amount;
		let finalEscrowBalance = (await getAccount(provider.connection, escrowAccount)).amount;

		let groupData = await program.account.group.fetch(group);
		assert.equal(groupData.balances[0].balance, 0);
		assert.equal(groupData.balances[1].balance, 5);
		assert.equal(initialPayerBalance - finalPayerBalance, 5n);
		assert.equal(finalEscrowBalance - initialEscrowBalance, 5n);
	});

	it("Fails to withdraw more than the amount owed", async () => {
		try {
			let [escrowAuthority, escrowBump] = await PublicKey.findProgramAddress([Buffer.from("authority"), group.toBuffer()], program.programId);
			
			await program.methods.withdraw(new BN(6)).accounts({
				group,
				recipient: payerAccount,
				escrow: escrowAccount,
				escrowAuthority,
				payer: user.publicKey,
				tokenProgram: TOKEN_PROGRAM_ID
			}).signers([user]).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "InsufficientUserBalance");
		}
	});

	it("Fails to withdraw with the wrong escrow authority", async () => {
		let dummyKeypair = Keypair.generate();

		try {
			await program.methods.withdraw(new BN(5)).accounts({
				group,
				recipient: payerAccount,
				escrow: escrowAccount,
				escrowAuthority: dummyKeypair.publicKey,
				payer: user.publicKey,
				tokenProgram: TOKEN_PROGRAM_ID
			}).signers([user]).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "InconsistentEscrowAuthority");
		}
	});

	it("Withdraws the amount owed", async () => {
		let initialPayerBalance = (await getAccount(provider.connection, payerAccount)).amount;
		let initialEscrowBalance = (await getAccount(provider.connection, escrowAccount)).amount;

		let [escrowAuthority, escrowBump] = await PublicKey.findProgramAddress([Buffer.from("authority"), group.toBuffer()], program.programId);
		
		await program.methods.withdraw(new BN(5)).accounts({
			group,
			recipient: payerAccount,
			escrow: escrowAccount,
			escrowAuthority,
			payer: user.publicKey,
			tokenProgram: TOKEN_PROGRAM_ID
		}).signers([user]).rpc();

		let finalPayerBalance = (await getAccount(provider.connection, payerAccount)).amount;
		let finalEscrowBalance = (await getAccount(provider.connection, escrowAccount)).amount;

		let groupData = await program.account.group.fetch(group);
		assert.equal(groupData.balances[0].balance, 0);
		assert.equal(groupData.balances[1].balance, 0);
		assert.equal(finalPayerBalance - initialPayerBalance, 5n);
		assert.equal(initialEscrowBalance - finalEscrowBalance, 5n);
	});

	it("Fails to remove a user in a group without authorization", async () => {
		let dummyKeypair = Keypair.generate();

		try {
			await program.methods.removeUser(user.publicKey).accounts({
				group,
				payer: dummyKeypair.publicKey
			}).signers([dummyKeypair]).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "UnauthorizedRemove");
		}
	});

	it("Removes a user from a group", async () => {
		await program.methods.removeUser(user.publicKey).accounts({
			group,
			payer: payer.publicKey
		}).rpc();

		let groupData = await program.account.group.fetch(group);
		assert.equal(groupData.balances.length, 1);
	});

	it("Removes a user from a group as user", async () => {
		await program.methods.addUser(user.publicKey).accounts({
			group,
			payer: payer.publicKey
		}).rpc();

		let groupData = await program.account.group.fetch(group);
		assert.equal(groupData.balances.length, 2);

		await program.methods.removeUser(user.publicKey).accounts({
			group,
			payer: user.publicKey
		}).signers([user]).rpc();

		groupData = await program.account.group.fetch(group);
		assert.equal(groupData.balances.length, 1);
	});

	it("Fails to remove admin from group", async () => {
		try {
			await program.methods.removeUser(payer.publicKey).accounts({
				group,
				payer: payer.publicKey
			}).rpc();

			assert.fail();
		} catch(err: AnchorError) {
			assert.equal(err.error.errorCode.code, "CannotRemoveAdmin");
		}
	});

});
