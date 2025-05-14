use anchor_lang::prelude::Pubkey;
use std::str::FromStr;

pub const DISCRIMINATOR_SIZE: usize = 8;
pub const PUBKEY_SIZE: usize = 32;
pub const I64_SIZE: usize = 8;
pub const VEC_SIZE: usize = 4;

pub const MAX_GROUP_USERS: usize = 50;

pub const GROUP_SIZE: usize = DISCRIMINATOR_SIZE + PUBKEY_SIZE + PUBKEY_SIZE + VEC_SIZE + (MAX_GROUP_USERS * (PUBKEY_SIZE + I64_SIZE));

pub const ADMIN_PUBKEY: Pubkey = Pubkey::from_str("admnewKmeGHkU1ZM8kKaPfunvV4GPmZUAfQ48zNA6fL").unwrap();