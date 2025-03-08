use ::std::error::Error;
use axum::{body::Body, http::header, response::Response};
use futures::TryStreamExt;

const JPG_HEADER: [u8; 2] = [0xFF, 0xD8];
const PNG_HEADER: [u8; 8] = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
const GIF87_HEADER: [u8; 6] = *b"GIF87a";
const GIF89_HEADER: [u8; 6] = *b"GIF89a";
const RIFF_HEADER: [u8; 4] = *b"RIFF";
const WEBP_HEADER: [u8; 4] = *b"WEBP";
const FTYP_HEADER: [u8; 4] = *b"ftyp";
const AVIF_HEADER: [u8; 4] = *b"avif";

pub(super) async fn check_remote_file(url: &str) -> Result<bool, Box<dyn Error>> {
	let mut header = [0; 12];

	{
		let mut stream = reqwest::get(url).await?.bytes_stream();

		let mut read_bytes = 0;

		while let Some(chunk) = stream.try_next().await? {
			let bytes_to_copy = ::std::cmp::min(8 - read_bytes, chunk.len());
			header[read_bytes..read_bytes + bytes_to_copy].copy_from_slice(&chunk[..bytes_to_copy]);
			read_bytes += bytes_to_copy;

			if read_bytes >= 12 {
				break;
			}
		}
	}

	let is_jpg = header.starts_with(&JPG_HEADER);
	let is_png = header.starts_with(&PNG_HEADER);
	let is_webp = header.starts_with(&RIFF_HEADER) && header[8..12] == WEBP_HEADER;
	let is_avif = header.starts_with(&FTYP_HEADER) && header[8..12] == AVIF_HEADER;
	let is_gif = header.starts_with(&GIF87_HEADER) || header.starts_with(&GIF89_HEADER);

	Ok(is_jpg || is_png || is_webp || is_avif || is_gif)
}

pub(super) async fn proxy(url: &str) -> Result<Response, Box<dyn Error>> {
	let res = reqwest::get(url).await?;

	let proxy_res = res
		.headers()
		.iter()
		.fold(
			Response::builder().status(res.status()),
			|builder, (k, v)| {
				if k == header::ACCESS_CONTROL_ALLOW_ORIGIN {
					builder
				} else {
					builder.header(k, v)
				}
			},
		)
		.header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
		.body(Body::from_stream(res.bytes_stream()))?;

	Ok(proxy_res)
}
