use std::time::Duration;

use tokio::{
	sync::broadcast::{Sender, channel},
	time::interval,
};
use uuid::Uuid;

use crate::repository::Repository;

pub struct AppState {
	pub(crate) repo: Repository,
	pub(crate) message_sender: Sender<(Option<Uuid>, String)>,
	pub(crate) shutdown_sender: Sender<()>,
	pub(crate) heartbeat_sender: Sender<()>,
}

impl AppState {
	pub fn new(repo: Repository) -> Self {
		let (message_sender, _) = channel(16);
		let (shutdown_sender, mut shutdown_receiver) = channel(1);
		let (heartbeat_sender, _) = channel(2);

		let heartbeat_sender_clone = heartbeat_sender.clone();
		let message_sender_clone = message_sender.clone();

		tokio::spawn(async move {
			let mut interval = interval(Duration::from_secs(10));
			loop {
				tokio::select! {
					_ = interval.tick() => {
						if message_sender_clone.receiver_count() > 0 {
							heartbeat_sender_clone.send(()).ok();
						}
					}
					_ = shutdown_receiver.recv() => {
						break;
					}
				}
			}
		});

		Self {
			repo,
			message_sender,
			shutdown_sender,
			heartbeat_sender,
		}
	}
}

impl Drop for AppState {
	fn drop(&mut self) {
		self.shutdown_sender.send(()).ok();
	}
}
