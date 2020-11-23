use crate::PostgresPool;

use serenity::client::Context;
use serenity::collector::reaction_collector::ReactionAction::Added;
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
    let sent_message = msg.channel_id.say(ctx, "Fetching leaderboard...").await?;

    let pool = ctx
        .data
        .read()
        .await
        .get::<PostgresPool>()
        .cloned()
        .unwrap();

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
    .fetch_all(&pool)
    .await
    .unwrap();

    let row_chunks = rows
        .chunks(10)
        .map(|c| c.to_vec())
        .collect::<Vec<Vec<UserList>>>();

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

    let guild_name = ctx.http.get_guild(msg.guild_id.unwrap().0).await?.name;
    display_board(ctx, sent_message, 0 as usize, &joined_pages, guild_name).await?;

    Ok(())
}

#[allow(unused_variables, unused_mut)]
async fn display_board(
    ctx: &Context,
    mut sent_message: Message,
    mut page: usize,
    pages: &Vec<String>,
    guild_name: String,
) -> CommandResult {
    loop {
        sent_message
            .edit(ctx, |m| {
                m.embed(|e| {
                    e.title(format!("{} Leaderboard", guild_name))
                        .description(format!("```md\n{}```", &pages[page]))
                        .footer(|f| {
                            f.text(format!(
                                "{}/{} ● Click arrow to see next page",
                                page + 1,
                                pages.len()
                            ))
                        })
                        .color((235, 64, 52))
                })
                .content("")
            })
            .await?;
        if page != 0 {
            sent_message
                .react(&ctx.http, ReactionType::Unicode(String::from("◀\u{fe0f}")))
                .await?;
        }
        if page != pages.len() - 1 {
            sent_message
                .react(&ctx.http, ReactionType::Unicode(String::from("▶\u{fe0f}")))
                .await?;
        }
        let reaction = sent_message
            .await_reaction(ctx)
            .timeout(core::time::Duration::from_secs(120))
            .filter(move |r| {
                return r.emoji == ReactionType::Unicode(String::from("▶\u{fe0f}"))
                    || r.emoji == ReactionType::Unicode(String::from("◀\u{fe0f}"));
            })
            .await;

        match reaction {
            Some(ra) => {
                if let Added(r) = &*ra {
                    if r.emoji == ReactionType::Unicode(String::from("▶\u{fe0f}"))
                        && page < pages.len() - 1
                    {
                        page += 1;
                    } else if r.emoji == ReactionType::Unicode(String::from("◀\u{fe0f}"))
                        && page > 0
                    {
                        page -= 1;
                    }
                    sent_message.delete_reactions(&ctx.http).await?;
                }
            }
            _ => {
                sent_message.delete_reactions(&ctx.http).await?;
                sent_message
                    .edit(&ctx.http, |m| {
                        m.content("Leaderboard expired use command again to view.")
                            .suppress_embeds(true)
                    })
                    .await?;
                break;
            }
        }
    }

    Ok(())
}
