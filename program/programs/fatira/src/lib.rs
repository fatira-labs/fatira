use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_pack::Pack;
use spl_token::state::{Account as SplAccount, Mint as SplMint};
use spl_token::instruction::transfer as spl_transfer;
use solana_program::program::{invoke, invoke_signed};
use std::str::FromStr;
mod state;
mod error;
mod constants;
use crate::state::{Group};
use crate::error::{ErrorCode};
use crate::constants::{GROUP_SIZE, MAX_GROUP_USERS, ADMIN_PUBKEY};

declare_id!("ftra545Ysk9H9HjvhfqXh5xP5PTQTC1KV3rk4AADXeC");

#[program]
pub mod fatira {
    use super::*;

    pub fn create_group(ctx: Context<CreateGroup>) -> Result<()> {
        let group = &mut ctx.accounts.group;
        let payer = &ctx.accounts.payer;
        let currency = &ctx.accounts.currency;
        let escrow = &ctx.accounts.escrow;
        let admin = &ctx.accounts.admin;
        let (escrow_authority, _) = Pubkey::find_program_address(&[b"authority", group.key().as_ref()], ctx.program_id);
        let admin_pubkey = Pubkey::from_str(ADMIN_PUBKEY).unwrap();

        let currency_data = &currency.try_borrow_data()?;
        let _currency_account = SplMint::unpack(currency_data).map_err(|e| {
            msg!("Failed to unpack currency account: {:?}", e);
            error!(ErrorCode::InvalidCurrencyAccount)
        })?;
        let escrow_data = &escrow.try_borrow_data()?;
        let escrow_account = SplAccount::unpack(escrow_data).map_err(|e| {
            msg!("Failed to unpack escrow account: {:?}", e);
            error!(ErrorCode::InvalidEscrowAccount)
        })?;

        require_keys_eq!(admin.key(), admin_pubkey, ErrorCode::Unauthorized);
        require_keys_eq!(*currency.owner, *escrow.owner, ErrorCode::InconsistentTokenPrograms);
        require_keys_eq!(escrow_account.owner, escrow_authority, ErrorCode::InconsistentEscrowOwner);
        require_keys_eq!(currency.key(), escrow_account.mint, ErrorCode::InconsistentEscrowMint);
        require!(escrow_account.delegate.is_none(), ErrorCode::EscrowHasDelegate);
        require!(!escrow_account.is_frozen(), ErrorCode::EscrowIsFrozen);
        require!(escrow_account.close_authority.is_none(), ErrorCode::EscrowHasCloseAuthority);

        group.currency = currency.key();
        group.escrow = escrow.key();
        group.balances = Vec::with_capacity(MAX_GROUP_USERS);
        group.add_balance(payer.key(), 0)?;
        group.approve_balance(payer.key())?;

        Ok(())
    }

    pub fn add_user(ctx: Context<ModifyUser>, user: Pubkey) -> Result<()> {
        let group = &mut ctx.accounts.group;
        let payer = &ctx.accounts.payer;

        require_keys_eq!(payer.key(), group.get_admin().ok_or(error!(ErrorCode::UserDoesNotExist))?, ErrorCode::UnauthorizedAdd);

        group.add_balance(user, 0)?;

        Ok(())
    }

    pub fn approve_user(ctx: Context<ModifyUser>) -> Result<()> {
        let group = &mut ctx.accounts.group;
        let payer = ctx.accounts.payer.key();

        group.approve_balance(payer)?;

        Ok(())
    }

    pub fn remove_user(ctx: Context<ModifyUser>, user: Pubkey) -> Result<()> {
        let group = &mut ctx.accounts.group;
        let payer = &ctx.accounts.payer;
        let admin = group.get_admin().ok_or(error!(ErrorCode::UserDoesNotExist))?;

        require!(payer.key() == admin || payer.key() == user, ErrorCode::UnauthorizedRemove);

        group.remove_balance(user)?;

        Ok(())
    }

    pub fn transfer_admin(ctx: Context<ModifyUser>, user: Pubkey) -> Result<()> {
        let group = &mut ctx.accounts.group;
        let payer = &ctx.accounts.payer;

        require_keys_eq!(payer.key(), group.get_admin().ok_or(error!(ErrorCode::UserDoesNotExist))?, ErrorCode::UnauthorizedTransfer);

        group.transfer_admin(user)?;

        Ok(())
    }

    pub fn update_balances(ctx: Context<UpdateBalances>, total_cost: i64, users: Vec<Pubkey>, amounts: Vec<i64>) -> Result<()> {
        let group = &mut ctx.accounts.group;
        let payer = &ctx.accounts.payer;
        let admin = &ctx.accounts.admin;
        let admin_pubkey = Pubkey::from_str(ADMIN_PUBKEY).unwrap();

        require_keys_eq!(admin.key(), admin_pubkey, ErrorCode::Unauthorized);
        require_eq!(users.len(), amounts.len(), ErrorCode::InconsistentBalanceLengths);
        require!(total_cost > 0, ErrorCode::AmountIsNotPositive);

        group.change_balance(payer.key(), total_cost)?;
        for (i, amount) in amounts.iter().enumerate() {
            require!(*amount > 0, ErrorCode::AmountIsNotPositive);
            group.change_balance(users[i], -*amount)?;
        }

        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let group = &mut ctx.accounts.group;
        let sender = &ctx.accounts.sender;
        let escrow = &ctx.accounts.escrow;
        let payer = &ctx.accounts.payer;
        let token_program = &ctx.accounts.token_program;

        let sender_data = &sender.try_borrow_data()?;
        let sender_account = SplAccount::unpack(sender_data).map_err(|e| {
            msg!("Failed to unpack sender account: {:?}", e);
            error!(ErrorCode::InvalidSenderAccount)
        })?;

        require!(amount > 0, ErrorCode::AmountIsNotPositive);
        require_keys_eq!(sender_account.mint, group.currency, ErrorCode::InconsistentSenderMint);
        require_keys_eq!(token_program.key(), *sender.owner, ErrorCode::InconsistentTokenPrograms);
        require_keys_eq!(token_program.key(), *escrow.owner, ErrorCode::InconsistentTokenPrograms);
        require_keys_eq!(escrow.key(), group.escrow, ErrorCode::InconsistentEscrow);
        require_keys_eq!(payer.key(), sender_account.owner, ErrorCode::InconsistentSenderOwner);
        require!(!sender_account.is_frozen(), ErrorCode::SenderIsFrozen);

        let instruction = spl_transfer(&token_program.key(), &sender.key(), &escrow.key(), &payer.key(), &[], amount)?;
        invoke(&instruction, &[
            sender.to_account_info(), escrow.to_account_info(), payer.to_account_info(), token_program.to_account_info()
        ]).map_err(|e| {
            msg!("Failed to invoke transfer instruction: {:?}", e);
            error!(ErrorCode::TransferFailed)
        })?;

        group.change_balance(payer.key(), amount as i64)?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let group = &mut ctx.accounts.group;
        let recipient = &ctx.accounts.recipient;
        let escrow = &ctx.accounts.escrow;
        let payer = &ctx.accounts.payer;
        let token_program = &ctx.accounts.token_program;

        let balance = group.get_balance(payer.key()).ok_or(error!(ErrorCode::UserDoesNotExist))?;
        let recipient_data = &recipient.try_borrow_data()?;
        let recipient_account = SplAccount::unpack(recipient_data).map_err(|e| {
            msg!("Failed to unpack recipient account: {:?}", e);
            error!(ErrorCode::InvalidRecipientAccount)
        })?;
        let escrow_data = &escrow.try_borrow_data()?;
        let escrow_account = SplAccount::unpack(escrow_data).map_err(|e| {
            msg!("Failed to unpack escrow account: {:?}", e);
            error!(ErrorCode::InvalidEscrowAccount)
        })?;

        require!(amount > 0, ErrorCode::AmountIsNotPositive);
        require!(balance >= (amount as i64), ErrorCode::InsufficientUserBalance);
        require!(escrow_account.amount >= amount, ErrorCode::InsufficientEscrowBalance);
        require_keys_eq!(recipient_account.mint, group.currency, ErrorCode::InconsistentRecipientMint);
        require_keys_eq!(token_program.key(), *recipient.owner, ErrorCode::InconsistentTokenPrograms);
        require_keys_eq!(token_program.key(), *escrow.owner, ErrorCode::InconsistentTokenPrograms);
        require_keys_eq!(escrow.key(), group.escrow, ErrorCode::InconsistentEscrow);
        require_keys_eq!(payer.key(), recipient_account.owner, ErrorCode::InconsistentRecipientOwner);
        require!(!recipient_account.is_frozen(), ErrorCode::RecipientIsFrozen);

        let group_key = group.key();
        let (escrow_authority, escrow_bump) = Pubkey::find_program_address(&[b"authority", group_key.as_ref()], ctx.program_id);
        let signer_seeds: &[&[u8]] = &[b"authority", group_key.as_ref(), &[escrow_bump]];

        let instruction = spl_transfer(&token_program.key(), &escrow.key(), &recipient.key(), &escrow_authority.key(), &[], amount)?;
        invoke_signed(&instruction, &[
            escrow.to_account_info(), recipient.to_account_info(), token_program.to_account_info()
        ], &[signer_seeds]).map_err(|e| {
            msg!("Failed to invoke transfer instruction: {:?}", e);
            error!(ErrorCode::TransferFailed)
        })?;

        group.change_balance(payer.key(), -(amount as i64))?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateGroup<'info> {
    #[account(
        init,
        payer = payer,
        space = GROUP_SIZE,
    )]
    pub group: Account<'info, Group>,

    /// CHECK: verify that currency is a valid mint account with the correct token program
    pub currency: AccountInfo<'info>,

    /// CHECK: verify that escrow is a valid token account with the correct token program, owner, mint, delegate, and frozen status
    pub escrow: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account()]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ModifyUser<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,

    #[account()]
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateBalances<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,

    #[account()]
    pub payer: Signer<'info>,

    #[account()]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,

    /// CHECK: verify that sender is a valid token account with the correct mint
    #[account(mut)]
    pub sender: AccountInfo<'info>,

    /// CHECK: verify that escrow is a valid token account with the correct mint and matches the group escrow
    #[account(mut)]
    pub escrow: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: verify that the token program matches the sender and escrow
    pub token_program: AccountInfo<'info>,

}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,

    /// CHECK: verify that recipient is a valid token account with the correct mint
    #[account(mut)]
    pub recipient: AccountInfo<'info>,

    /// CHECK: verify that escrow is a valid token account with the correct mint and matches the group escrow
    #[account(mut)]
    pub escrow: AccountInfo<'info>,

    #[account()]
    pub payer: Signer<'info>,

    /// CHECK: verify that the token program matches the sender and escrow
    pub token_program: AccountInfo<'info>,

}