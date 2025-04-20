use ::std::time::Duration;
use rand::Rng as _;
use serde_json::Value;
use sqlx::{
	Decode, Encode, FromRow, Postgres, Type,
	encode::IsNull,
	error::BoxDynError,
	postgres::{PgArgumentBuffer, PgTypeInfo, PgValueRef},
};
use tokio::time::sleep;
use uuid::Uuid;

#[derive(FromRow)]
pub(super) struct RecordId(Uuid);

impl RecordId {
	pub fn into_api(self) -> Option<Value> {
		Some(self.into())
	}
}

impl From<RecordId> for Value {
	fn from(RecordId(uuid): RecordId) -> Self {
		return Value::String(uuid.to_string());
	}
}

impl Type<Postgres> for RecordId {
	fn type_info() -> PgTypeInfo {
		<Uuid as Type<Postgres>>::type_info()
	}
}

impl<'r> Decode<'r, Postgres> for RecordId {
	fn decode(value: PgValueRef<'r>) -> Result<Self, BoxDynError> {
		let uuid = <Uuid as Decode<Postgres>>::decode(value)?;
		Ok(RecordId(uuid))
	}
}

impl Encode<'_, Postgres> for RecordId {
	fn encode_by_ref(&self, buf: &mut PgArgumentBuffer) -> Result<IsNull, BoxDynError> {
		<Uuid as Encode<Postgres>>::encode_by_ref(&self.0, buf)
	}
}

pub(super) async fn prevent_timing_attack() {
	let random_millis: u64 = rand::rng().random_range(1..=50);
	sleep(Duration::from_millis(random_millis)).await;
}
