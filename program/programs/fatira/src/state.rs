use anchor_lang::prelude::*;
use crate::error::{ErrorCode};
use crate::constants::{MAX_GROUP_USERS};

#[account]
pub struct Group {
	pub currency: Pubkey,
	pub escrow: Pubkey,
	pub balances: Vec<UserBalance>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UserBalance {
	pub user: Pubkey,
	pub balance: i64,
	pub approved: bool,
}

impl Group {
	pub fn add_balance(&mut self, user: Pubkey, balance: i64) -> Result<()> {
		require!(self.balances.len() < MAX_GROUP_USERS, ErrorCode::GroupAtCapacity);
		require!(!self.balances.iter().any(|bal| bal.user == user), ErrorCode::UserAlreadyExists);

		self.balances.push(UserBalance {
			user,
			balance,
			approved: false,
		});

		Ok(())
	}

	pub fn approve_balance(&mut self, user: Pubkey) -> Result<()> {
		let balance = self.balances.iter_mut().find(|bal| bal.user == user).ok_or(error!(ErrorCode::UserDoesNotExist))?;
		
		balance.approved = true;
		
		Ok(())
	}

	pub fn get_balance(&self, user: Pubkey) -> Option<i64> {
		self.balances.iter().find(|bal| bal.user == user).map(|bal| bal.balance)
	}

	pub fn remove_balance(&mut self, user: Pubkey) -> Result<()> {
		let i = self.balances.iter().position(|bal| bal.user == user).ok_or(error!(ErrorCode::UserDoesNotExist))?;
		
		require!(i != 0, ErrorCode::CannotRemoveAdmin);
		require!(self.balances[i].balance == 0, ErrorCode::UserBalanceNonZero);

		self.balances.remove(i);

		Ok(())
	}

	pub fn get_admin(&self) -> Option<Pubkey> {
		self.balances.first().map(|bal| bal.user)
	}

	pub fn transfer_admin(&mut self, user: Pubkey) -> Result<()> {
		let i = self.balances.iter().position(|bal| bal.user == user).ok_or(error!(ErrorCode::UserDoesNotExist))?;

		require!(i != 0, ErrorCode::AlreadyAdmin);
		require!(self.balances[i].approved, ErrorCode::UserNotApproved);

		self.balances.swap(0, i);

		Ok(())
	}

	pub fn change_balance(&mut self, user: Pubkey, amount: i64) -> Result<()> {
		let i = self.balances.iter().position(|bal| bal.user == user).ok_or(error!(ErrorCode::UserDoesNotExist))?;
		let user_balance = &mut self.balances[i];

		require!(user_balance.approved, ErrorCode::UserNotApproved);

		let new_balance = user_balance.balance.checked_add(amount).ok_or(error!(ErrorCode::AmountOverflow))?;
		user_balance.balance = new_balance;

		Ok(())
	}
}