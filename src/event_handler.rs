use crate::functions::{add_xp, pin};

use serenity::async_trait;
use serenity::client::{Context, EventHandler};
use serenity::model::{
    channel::Message, channel::Reaction, gateway::Ready, permissions::Permissions,
};

pub struct Handler;

#[async_trait]
impl EventHandler for Handler {
    // Generate discord link to invite bot with some perms when bot is ready
    async fn ready(&self, ctx: Context, ready: Ready) {
        match ready
            .user
            .invite_url(&ctx.http, Permissions::from_bits_truncate(336391376))
            .await
        {
            Ok(url) => println!("Invite bot here: {}", url,),
            Err(err) => println!("Failed to generate bot invite, error: {:?}", err),
        }
    }

    async fn message(&self, ctx: Context, msg: Message) {
        //TODO: make sure not DM or summat
        add_xp(&ctx, &msg).await;
    }

    async fn reaction_add(&self, ctx: Context, reaction: Reaction) {
        if let Err(e) = pin(&ctx, &reaction).await {
            panic!(e);
        }
    }
}
