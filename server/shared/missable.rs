use serde::{Deserialize, Deserializer};

#[derive(Debug, PartialEq)]
pub(crate) enum Missable<T> {
	Missed,             // поля нет в JSON
	Present(Option<T>), // поле есть и содержит значение либо null
}

impl<T> Default for Missable<T> {
	fn default() -> Self {
		Self::Missed
	}
}

impl<'de, T: Deserialize<'de>> Deserialize<'de> for Missable<T> {
	fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Missable<T>, D::Error> {
		Ok(Missable::Present(Option::deserialize(deserializer)?))
		// Если поле отсутствует, serde даже не вызовет эту функцию, поэтому нужен #[serde(default)]
	}
}

impl<T: Default> Missable<T> {
	#[allow(unused)]
	pub(crate) fn deep_unwrap_or_default(self) -> T {
		match self {
			Self::Missed => T::default(),
			Self::Present(val) => val.unwrap_or_default(),
		}
	}

	pub(crate) fn deep_unwrap_or_else<F: FnOnce() -> T>(self, f: F) -> T {
		match self {
			Self::Missed => f(),
			Self::Present(val) => val.unwrap_or_else(f),
		}
	}
}

#[cfg(test)]
mod tests {
	use super::*;

	#[derive(Debug, Deserialize)]
	struct Test {
		#[serde(default)]
		test: Missable<String>,
	}

	#[derive(Debug, Deserialize)]
	struct Serde {
		#[serde(default)]
		test: Option<Option<String>>,
	}

	#[test]
	fn test_mti_validation() {
		let t1 = serde_json::from_str::<Serde>(r#"{"test": "test"}"#).unwrap();
		let t2 = serde_json::from_str::<Serde>(r#"{"test": null}"#).unwrap();
		let t3 = serde_json::from_str::<Serde>(r#"{}"#).unwrap();

		assert_eq!(t1.test, Some(Some("test".into())));
		assert_eq!(t2.test, None);
		assert_eq!(t3.test, None);

		let t1 = serde_json::from_str::<Test>(r#"{"test": "test"}"#).unwrap();
		let t2 = serde_json::from_str::<Test>(r#"{"test": null}"#).unwrap();
		let t3 = serde_json::from_str::<Test>(r#"{}"#).unwrap();

		assert_eq!(t1.test, Missable::Present(Some("test".into())));
		assert_eq!(t2.test, Missable::Present(None));
		assert_eq!(t3.test, Missable::Missed);
	}
}
