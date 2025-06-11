use serde::{Deserialize, Deserializer};

pub(crate) fn deserialize_missed<'de, D, T>(deser: D) -> Result<Option<Option<T>>, D::Error>
where
	D: Deserializer<'de>,
	T: Deserialize<'de>,
{
	// Если поле отсутствует, serde не вызовет эту функцию, поэтому нужен #[serde(default)]
	Ok(Some(Option::deserialize(deser)?))
}

#[cfg(test)]
mod tests {
	use super::*;

	#[derive(Deserialize)]
	struct Test {
		#[serde(default, deserialize_with = "deserialize_missed")]
		test: Option<Option<String>>,
	}

	#[test]
	fn test_mti_validation() {
		let t1 = serde_json::from_str::<Test>(r#"{"test": "test"}"#).unwrap();
		let t2 = serde_json::from_str::<Test>(r#"{"test": null}"#).unwrap();
		let t3 = serde_json::from_str::<Test>(r#"{}"#).unwrap();

		assert_eq!(t1.test, Some(Some("test".into())));
		assert_eq!(t2.test, Some(None));
		assert_eq!(t3.test, None);
	}
}
