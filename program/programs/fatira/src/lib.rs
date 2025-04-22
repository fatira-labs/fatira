use anchor_lang::prelude::*;

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
pub struct Initialize {}
