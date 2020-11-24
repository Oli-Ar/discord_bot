use serenity::client::Context;
use serenity::framework::standard::CommandResult;
use serenity::model::channel::{Reaction, ReactionType};

pub async fn pin(ctx: &Context, rct: &Reaction) -> CommandResult {
    // Ensure reaction is pin emoji
    if rct.emoji != ReactionType::Unicode(String::from("📌")) {
        return Ok(());
    }
    // Fetch message and then find the amount of pin reaction on a message
    let reaction_message = rct.message(&ctx.http).await?;
    let emote_count = if let Some(r) = reaction_message
        .reactions
        .iter()
        .find(|r| r.reaction_type == rct.emoji)
    {
        r.count
    } else {
        0
    };
    // If 5 pin reactions pin message, notifies user if bot can't pin messages
    if emote_count == 5 {
        if let Err(_) = reaction_message.pin(&ctx.http).await {
            reaction_message
                .channel_id
                .say(
                    &ctx.http,
                    "Failed to pin message lacking manage messages permission.",
                )
                .await?;
        }
    }

    Ok(())
}
