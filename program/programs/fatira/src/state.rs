use anchor_lang::prelude::*;

const MAX_GROUP_NAME: usize = 50;
const MAX_GROUP_USERS: usize = 50;

#[account]
#[derive(InitSpace)]
pub struct Group {
	pub currency: Pubkey,
	pub pool: u64,
	pub users_size: u8,
	pub users: [Pubkey; MAX_GROUP_USERS],
	pub balances: [i64; MAX_GROUP_USERS],
}