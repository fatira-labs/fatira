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

	#[msg("An invalid currency account was provided")]
	InvalidCurrencyAccount,

	#[msg("An invalid escrow account was provided")]
	InvalidEscrowAccount,

	#[msg("The currency account and escrow account are owned by different programs")]
	InconsistentTokenPrograms,

	#[msg("The escrow owner does not match the group PDA")]
	InconsistentEscrowOwner,

	#[msg("The escrow mint does not match the currency mint")]
	InconsistentEscrowMint,

	#[msg("The escrow has a delegate")]
	EscrowHasDelegate,

	#[msg("The escrow is frozen")]
	EscrowIsFrozen,
}