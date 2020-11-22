use std::collections::HashMap;
use std::time::Instant;

use serenity::prelude::TypeMapKey;

#[derive(Clone)]
pub struct UserCache {
    cache: HashMap<u64, Instant>,
}

impl TypeMapKey for UserCache {
    type Value = UserCache;
}

impl UserCache {
    pub fn new() -> Self {
        UserCache {
            cache: HashMap::new(),
        }
    }

    pub async fn clear(&mut self) {
        for (k, v) in &self.cache.clone() {
            if Instant::now().duration_since(*v).as_secs() > 60 {
                self.cache.remove(&k);
            }
        }
    }

    pub async fn add(&mut self, member: u64) {
        self.cache.insert(member, Instant::now());
    }

    pub async fn check(&self, member: u64) -> bool {
        self.cache.contains_key(&member)
    }
}
