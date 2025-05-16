import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor";
import { Fatira } from "../target/types/fatira";
import fs from "fs";
import os from "os";
import { assert } from "chai";
import { Token, TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, createSetAuthorityInstruction, AuthorityType } from "@solana/spl-token";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

describe("fatira", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.fatira as Program<Fatira>;

  const payer = provider.wallet as anchor.Wallet;
  const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(`${os.homedir()}/admnewKmeGHkU1ZM8kKaPfunvV4GPmZUAfQ48zNA6fL.json`))));
  let groupKey: PublicKey;
  let groupAccount: anchor.web3.AccountInfo<Buffer>;

  let mint: PublicKey;
  let payerAccount: PublicKey;
  let escrowAccount: PublicKey;
  let fakeEscrowAccount: PublicKey;
  let groupSigner: Keypair;
  let group: PublicKey;

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(admin.publicKey, LAMPORTS_PER_SOL)
    )

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
    } catch(err) {
      const anchorError = err as AnchorError;
      assert.equal(anchorError.error.errorCode.code, "InconsistentEscrowOwner");
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
    } catch(err) {
      const anchorError = err as AnchorError;
      assert.equal(anchorError.error.errorCode.code, "Unauthorized");
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
});
