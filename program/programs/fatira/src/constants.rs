pub const DISCRIMINATOR_SIZE: usize = 8;
pub const PUBKEY_SIZE: usize = 32;
pub const I64_SIZE: usize = 8;
pub const BOOL_SIZE: usize = 1;
pub const VEC_SIZE: usize = 4;

pub const MAX_GROUP_USERS: usize = 50;

pub const USER_BALANCE_SIZE: usize = PUBKEY_SIZE + I64_SIZE + BOOL_SIZE;
pub const GROUP_SIZE: usize = DISCRIMINATOR_SIZE + PUBKEY_SIZE + PUBKEY_SIZE + VEC_SIZE + (MAX_GROUP_USERS * USER_BALANCE_SIZE);

pub const ADMIN_PUBKEY: &str = "admnewKmeGHkU1ZM8kKaPfunvV4GPmZUAfQ48zNA6fL";