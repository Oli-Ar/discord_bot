use serenity::client::Context;
use serenity::framework::standard::{macros::command, CommandResult};
use serenity::model::channel::Message;

#[command]
pub async fn ping(ctx: &Context, msg: &Message) -> CommandResult {
    let mut reply = msg
        .channel_id
        .say(ctx, "Pong! Calculating ping to bot")
        .await?;
    let ping = (reply.timestamp - msg.timestamp).num_milliseconds();
    reply
        .edit(&ctx.http, |m| {
            m.content(&format!("Pong! Ping to bot is: {}ms", ping))
        })
        .await?;

    Ok(())
}
