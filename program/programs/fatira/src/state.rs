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
}

impl Group {
	pub fn add_balance(&mut self, user: Pubkey, balance: i64) -> Result<()> {
		if self.balances.len() >= MAX_GROUP_USERS {
			return Err(error!(ErrorCode::GroupAtCapacity))
		}
		if self.balances.iter().any(|bal| bal.user == user) {
			return Err(error!(ErrorCode::UserAlreadyExists));
		}
		self.balances.push(UserBalance { user, balance });
		Ok(())
	}

	pub fn get_balance(&self, user: Pubkey) -> Option<i64> {
		self.balances.iter().find(|bal| bal.user == user).map(|bal| bal.balance)
	}

	pub fn remove_balance(&mut self, user: Pubkey) -> Result<()> {
		if let Some(i) = self.balances.iter().position(|bal| bal.user == user) {
			if i == 0 {
				return Err(error!(ErrorCode::CannotRemoveAdmin))
			}
			if self.balances[i].balance != 0 {
				return Err(error!(ErrorCode::UserBalanceNonZero));
			}
			self.balances.remove(i);
			Ok(())
		} else {
			Err(error!(ErrorCode::UserDoesNotExist))
		}
	}

	pub fn get_admin(&self) -> Option<Pubkey> {
		self.balances.first().map(|bal| bal.user)
	}

	pub fn transfer_admin(&mut self, user: Pubkey) -> Result<()> {
		if let Some(i) = self.balances.iter().position(|bal| bal.user == user) {
			if i == 0 {
				return Ok(())
			}
			self.balances.swap(0, i);
			Ok(())
		} else {
			Err(error!(ErrorCode::UserDoesNotExist))
		}
	}
}