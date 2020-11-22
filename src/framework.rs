use crate::commands::*;

use serenity::framework::standard::macros::group;

#[group("User Commands")]
// TODO: temp prefix, change to > when bot is done
#[prefix = "!"]
#[commands(ping, leaderboard)]
struct User;

#[group("Commands")]
#[sub_groups(user)]
pub struct Command;
