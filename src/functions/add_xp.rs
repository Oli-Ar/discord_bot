use crate::user_cache::UserCache;
use crate::PostgresPool;

use serenity::client::Context;
use serenity::model::channel::Message;

use sqlx::Done;

pub async fn add_xp(ctx: &Context, msg: &Message) {
    let mut data = ctx.data.write().await;
    {
        let user_cache = data.get_mut::<UserCache>().unwrap();
        user_cache.clear().await;
        if user_cache.check(msg.author.id.0).await {
            return;
        };
    }
    let pool = data.get::<PostgresPool>().unwrap();

    let xp: i32 = (rand::random::<f32>() * 20f32) as i32 + 10;

    let rows = sqlx::query!(
        "update UserServers set user_xp = user_xp + $1 where (user_id = $2) and (server_id = $3)",
        xp,
        msg.author.id.0 as i64,
        msg.guild_id.unwrap().0 as i64,
    )
    .execute(pool)
    .await
    .unwrap();

    if rows.rows_affected() == 0u64 {
        if let Err(_) = sqlx::query!(
            "insert into users (user_id)
            values ($1)",
            msg.author.id.0 as i64,
        )
        .execute(pool)
        .await
        {
            // User was already part of DB
        }

        if let Err(_) = sqlx::query!(
            "insert into servers (server_id)
            values ($1)",
            msg.guild_id.unwrap().0 as i64,
        )
        .execute(pool)
        .await
        {
            // Server part of DB
        }

        sqlx::query!(
            "insert into UserServers (user_id, server_id, user_xp)
            values ($1, $2, $3)",
            msg.author.id.0 as i64,
            msg.guild_id.unwrap().0 as i64,
            xp,
        )
        .execute(pool)
        .await
        .unwrap();
    }

    drop(pool);
    let user_cache = data.get_mut::<UserCache>().unwrap();
    user_cache.add(msg.author.id.0).await;
}
