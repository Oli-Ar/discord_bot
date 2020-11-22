use crate::PostgresPool;

use serenity::client::Context;
use serenity::collector::reaction_collector::ReactionAction;
use serenity::framework::standard::{macros::command, CommandResult};
use serenity::model::channel::{Message, ReactionType};

use futures_util::stream::StreamExt;
use num_traits::cast::{FromPrimitive, ToPrimitive};

#[derive(Debug, Clone)]
struct UserList {
    user_id: sqlx::types::BigDecimal,
    user_xp: Option<i32>,
}

#[command]
pub async fn leaderboard(ctx: &Context, msg: &Message) -> CommandResult {
    let data = ctx.data.write().await;
    let pool = data.get::<PostgresPool>().unwrap();
    let rows: Vec<UserList> = sqlx::query_as!(
        UserList,
        "
        select user_id, user_xp
        from UserServers where server_id = $1
        order by user_xp desc
        limit 100
        ",
        sqlx::types::BigDecimal::from_u64(msg.guild_id.unwrap().0).unwrap(),
    )
    .fetch_all(pool)
    .await
    .unwrap();

    let row_chunks = rows
        .chunks(10)
        .map(|c| c.to_vec())
        .collect::<Vec<Vec<UserList>>>();

    let sent_message = msg.channel_id.say(ctx, "Beep").await?;

    let mut joined_pages: Vec<String> = Vec::new();
    let mut all_pages_stream = futures::stream::iter(row_chunks.into_iter().enumerate());
    while let Some((i, p)) = all_pages_stream.next().await {
        let mut one_page_stream = futures::stream::iter(p.into_iter().enumerate());
        joined_pages.push(String::from(""));
        while let Some((j, c)) = one_page_stream.next().await {
            joined_pages[i].push_str(&format!(
                "\n{}. {}: {}",
                i * 10 + j + 1,
                &ctx.http
                    .get_user(c.user_id.to_u64().unwrap())
                    .await
                    .unwrap()
                    .name,
                c.user_xp.unwrap(),
            ));
        }
    }

    display_board(ctx, sent_message, 0 as usize, &joined_pages).await?;

    Ok(())
}

#[allow(unused_variables)]
async fn display_board(
    ctx: &Context,
    mut sent_message: Message,
    mut page: usize,
    pages: &Vec<String>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    sent_message.edit(ctx, |m| m.content("boop")).await?;
    let reaction = sent_message
        .await_reaction(ctx)
        .timeout(core::time::Duration::from_secs(120))
        // .filter(|r| {
        //     return r.emoji == ReactionType::Unicode("▶\u{fe0f}")
        //         || r.emoji == ReactionType::Unicode('\u{25c0}'.to_string());
        // })
        .message_id(sent_message.id)
        .await;

    println!("{:?}", reaction);

    Ok(())
}
