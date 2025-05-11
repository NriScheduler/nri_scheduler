use ::std::{
	fmt::{self, Formatter},
	marker::PhantomData,
};
use serde::{
	Deserialize, Deserializer,
	de::{self, DeserializeOwned, IntoDeserializer as _, Visitor},
};

pub(crate) fn deserialize_list<'de, D, T>(deserializer: D) -> Result<Vec<T>, D::Error>
where
	D: Deserializer<'de>,
	T: DeserializeOwned,
{
	struct ListVisitor<T>(PhantomData<T>);

	impl<'de, T: Deserialize<'de>> Visitor<'de> for ListVisitor<T> {
		type Value = Vec<T>;

		fn expecting(&self, formatter: &mut Formatter) -> fmt::Result {
			formatter.write_str("a string separated with a comma")
		}

		fn visit_str<E: de::Error>(self, value: &str) -> Result<Self::Value, E> {
			value
				.split(',')
				.filter_map(|s| {
					let s = s.trim();
					if s.is_empty() {
						None
					} else {
						Some(T::deserialize(s.into_deserializer()))
					}
				})
				.collect()
		}
	}

	deserializer.deserialize_any(ListVisitor(PhantomData))
}
