use anchor_lang::prelude::*;

const MAX_USER_USERNAME = 20;
const MAX_USER_GROUPS = 20;

const MAX_GROUP_NAME = 50;
const MAX_GROUP_USERS = 50;

const MAX_EXPENSE_NAME = 50;
const MAX_EXPENSE_DESCRIPTION = 200;
const MAX_EXPENSE_URL = 200;

#[account]
pub struct User {
	pub owner: Pubkey,
	pub username_size: u8,
	pub username: [u8; MAX_USER_USERNAME],
	pub groups_size: u8,
	pub groups: [Pubkey; MAX_USER_GROUPS],
}

#[account]
pub struct Group {
	pub name_size: u8,
	pub name: [u8; MAX_GROUP_NAME],
	pub currency: Pubkey,
	pub pool: u64,
	pub users_size: u8,
	pub users: [Pubkey; MAX_GROUP_USERS],
	pub balances: [i64; MAX_GROUP_USERS],
}

#[account]
pub struct Expense {
	pub group: Pubkey,
	pub name_size: u8,
	pub name: [u8; MAX_EXPENSE_NAME],
	pub description_size: u8,
	pub description: [u8; MAX_EXPENSE_DESCRIPTION],
	pub url_size: u8,
	pub url: [u8; MAX_EXPENSE_URL],
	pub total_cost: u64,
	pub payee: Pubkey,
	pub payers_size: u8,
	pub payers: [Pubkey; MAX_GROUP_USERS],
	pub amounts: [Pubkey; MAX_GROUP_USERS]
}