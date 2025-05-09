use anchor_lang::prelude::*;
mod state;
mod error;
mod constants;
use crate::state::{Group};
use crate::constants::{GROUP_SIZE, MAX_GROUP_USERS};

declare_id!("ftra545Ysk9H9HjvhfqXh5xP5PTQTC1KV3rk4AADXeC");

#[program]
pub mod fatira {
    use super::*;

    pub fn create_group(ctx: Context<CreateGroup>, currency: Pubkey, escrow: Pubkey) -> Result<()> {
        let group = &mut ctx.accounts.group;
        group.currency = currency;
        group.escrow = escrow;
        group.balances = Vec::with_capacity(MAX_GROUP_USERS);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateGroup<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        space = GROUP_SIZE,
    )]
    pub group: Account<'info, Group>,

    pub system_program: Program<'info, System>,
}