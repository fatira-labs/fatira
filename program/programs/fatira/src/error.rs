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

	#[msg("Two token accounts are owned by different token programs")]
	InconsistentTokenPrograms,

	#[msg("The escrow owner does not match the group PDA")]
	InconsistentEscrowOwner,

	#[msg("The escrow mint does not match the currency mint")]
	InconsistentEscrowMint,

	#[msg("The escrow has a delegate")]
	EscrowHasDelegate,

	#[msg("The escrow is frozen")]
	EscrowIsFrozen,

	#[msg("Lengths of users and amounts do not match")]
	InconsistentBalanceLengths,

	#[msg("Negative and zero amounts are not allowed")]
	AmountIsNotPositive,

	#[msg("An overflow occurred when modifying the balance")]
	AmountOverflow,

	#[msg("An invalid sender account was provided")]
	InvalidSenderAccount,

	#[msg("The sender mint does not match the currency mint")]
	InconsistentSenderMint,

	#[msg("The provided escrow account does not match the group escrow account")]
	InconsistentEscrow,

	#[msg("The transfer between token accounts failed")]
	TransferFailed,

	#[msg("An invalid recipient account was provided")]
	InvalidRecipientAccount,

	#[msg("The recipient mint does not match the currency mint")]
	InconsistentRecipientMint,

	#[msg("The owner of the sender account does not match the payer")]
	InconsistentSenderOwner,

	#[msg("The owner of the recipient account does not match the payer")]
	InconsistentRecipientOwner,

	#[msg("The user does not have a sufficient balance to process this withdrawal")]
	InsufficientUserBalance,

	#[msg("The escrow does not have a sufficient balance to process this withdrawal")]
	InsufficientEscrowBalance,

	#[msg("The instruction requires an admin key")]
	Unauthorized,

	#[msg("Only group admin can add users")]
	UnauthorizedAdd,

	#[msg("Only group admin or the user can remove a user")]
	UnauthorizedRemove,
}