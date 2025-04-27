use anchor_lang::prelude::*;

const MAX_USER_USERNAME: usize = 20;
const MAX_USER_GROUPS: usize = 20;

const MAX_GROUP_NAME: usize = 50;
const MAX_GROUP_USERS: usize = 50;

const MAX_EXPENSE_NAME: usize = 50;
const MAX_EXPENSE_DESCRIPTION: usize = 200;
const MAX_EXPENSE_URL: usize = 200;

#[account]
#[derive(InitSpace)]
pub struct User {
	pub owner: Pubkey,
	pub username_size: u8,
	pub username: [u8; MAX_USER_USERNAME],
	pub groups_size: u8,
	pub groups: [Pubkey; MAX_USER_GROUPS],
	pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Group {
	pub name_size: u8,
	pub name: [u8; MAX_GROUP_NAME],
	pub currency: Pubkey,
	pub pool: u64,
	pub users_size: u8,
	pub users: [Pubkey; MAX_GROUP_USERS],
	pub balances: [i64; MAX_GROUP_USERS],
}