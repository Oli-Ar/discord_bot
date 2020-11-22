mod commands;
mod event_handler;
mod framework;
mod functions;
mod user_cache;

use serenity::client::Client;
use serenity::framework::standard::{StandardFramework, WithWhiteSpace};
use serenity::prelude::TypeMapKey;

use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

use dotenv::dotenv;
use std::env;

use framework::*;

use event_handler::Handler;

use crate::user_cache::UserCache;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let framework = StandardFramework::new()
        .configure(|c| {
            c.with_whitespace(WithWhiteSpace::from(false))
                .by_space(false)
                .prefix(">")
        })
        .group(&COMMAND_GROUP);

    // Login with a bot token from the .env file
    dotenv().ok();
    let token = env::var("TOKEN").expect("TOKEN must be set");
    let mut client = Client::new(token)
        .event_handler(Handler)
        .framework(framework)
        .await
        .expect("Error creating client");

    // Connect to db using link from environment
    let uri = &env::var("DATABASE_URL").expect("DATABASE_URL needs to be set");
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(uri)
        .await?;

    // Add the db connection pool to bot data field
    {
        let mut data = client.data.write().await;
        data.insert::<PostgresPool>(pool);
        data.insert::<UserCache>(UserCache::new());
    }

    // Start listening for events by starting a single shard
    if let Err(why) = client.start().await {
        println!("An error occurred while running the client: {:?}", why);
    }

    Ok(())
}

// Create type for db connection pool to pass into client
pub struct PostgresPool;

impl TypeMapKey for PostgresPool {
    type Value = PgPool;
}
