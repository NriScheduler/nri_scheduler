use std::{convert::Infallible, sync::Arc};

use axum::{
	extract::{Extension, State},
	response::sse::{Event, KeepAlive, Sse},
};
use futures_util::{StreamExt as _FuturesStreamExt, stream::Stream};
use tokio_stream::{StreamExt as TokioStreamExt, wrappers::BroadcastStream};
use uuid::Uuid;

use crate::state::AppState;

pub(crate) async fn sse_handler(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Option<Uuid>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
	// Создаем подписки с явным временем жизни
	let message_receiver = state.message_sender.subscribe();
	let heartbeat_receiver = state.heartbeat_sender.subscribe();
	let mut shutdown_receiver = state.shutdown_sender.subscribe();

	let event_stream = TokioStreamExt::filter_map(
		BroadcastStream::new(message_receiver),
		move |event_result| {
			let (for_user, msg) = event_result.ok()?;
			for_user
				.is_none_or(|id| Some(id) == user_id)
				.then_some(Ok(Event::default().data(msg)))
		},
	);

	let heartbeat_stream = TokioStreamExt::map(BroadcastStream::new(heartbeat_receiver), |_| {
		Ok(Event::default().event("heartbeat"))
	});

	let stream = TokioStreamExt::take_while(event_stream.merge(heartbeat_stream), |res| res.is_ok())
		.take_until(async move { shutdown_receiver.recv().await.ok() });

	Sse::new(stream).keep_alive(KeepAlive::default())
}
