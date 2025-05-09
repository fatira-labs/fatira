use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
	#[msg("The user already exists in this group")]
	UserAlreadyExists,
	#[msg("The user does not exist in this group")]
	UserDoesNotExist,
	#[msg("The user has a non-zero balance")]
	UserBalanceNonZero,
	#[msg("The group has reached maximum capacity")]
	GroupAtCapacity,
	#[msg("The admin of the group cannot be removed")]
	CannotRemoveAdmin,
}