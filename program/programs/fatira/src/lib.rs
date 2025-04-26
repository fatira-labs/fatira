use anchor_lang::prelude::*;
mod state;
use state::{User, Group, Expense};

const DISCRIMINATOR_SIZE: usize = 8;

declare_id!("ftra545Ysk9H9HjvhfqXh5xP5PTQTC1KV3rk4AADXeC");

#[program]
pub mod fatira {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init_if_needed,
        payer = signer,
        space = DISCRIMINATOR_SIZE + User::INIT_SPACE,
        seeds = [b"user", username.as_bytes()],
        bump,
    )]
    pub user: Account<'info, User>,

    #[account(
        init_if_needed,
        payer = signer,
        space = DISCRIMINATOR_SIZE + Group::INIT_SPACE,
    )]
    pub group: Account<'info, Group>,

    #[account(
        init_if_needed,
        payer = signer,
        space = DISCRIMINATOR_SIZE + Expense::INIT_SPACE,
    )]
    pub expense: Account<'info, Expense>,
    pub system_program: Program<'info, System>,

}
