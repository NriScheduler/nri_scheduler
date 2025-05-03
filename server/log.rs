use std::sync::{Arc, LazyLock};

use tokio::{
	fs::{File, OpenOptions},
	io::AsyncWriteExt,
	sync::Mutex,
};

static FILE: LazyLock<Arc<Mutex<Option<File>>>> = LazyLock::new(|| Arc::new(Mutex::new(None)));

pub(crate) fn log(msg: impl AsRef<[u8]> + Send + 'static) {
	tokio::spawn(async_log(msg));
}

async fn async_log(msg: impl AsRef<[u8]>) {
	let mut file_guard = FILE.lock().await;

	// Открываем файл если еще не открыт
	if file_guard.is_none() {
		match OpenOptions::new()
			.create(true)
			.append(true)
			.open("app.log")
			.await
		{
			Ok(file) => *file_guard = Some(file),
			Err(err) => {
				eprintln!("Failed to open log file: {}", err);
				return;
			}
		}
	}

	// Записываем в файл
	if let Some(file) = &mut *file_guard {
		file.write_all(msg.as_ref()).await.ok();
		file.write_all(b"\n").await.ok();
	}
}
