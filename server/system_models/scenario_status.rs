#![allow(clippy::upper_case_acronyms)]
use serde::{Deserialize, Deserializer, Serialize, Serializer, de::Error as _};

#[allow(non_camel_case_types)]
#[derive(Debug, PartialEq)]
pub(crate) enum EScenarioStatus {
	SCENARIO_SUCCESS,
	SCENARIO_FAIL,
	UNAUTHORIZED,
	SESSION_EXPIRED,
	SYSTEM_ERROR,
}

impl<'de> Deserialize<'de> for EScenarioStatus {
	fn deserialize<D>(deserializer: D) -> Result<EScenarioStatus, D::Error>
	where
		D: Deserializer<'de>,
	{
		match u16::deserialize(deserializer)? {
			0 => Ok(EScenarioStatus::SCENARIO_SUCCESS),
			400 => Ok(EScenarioStatus::SCENARIO_FAIL),
			401 => Ok(EScenarioStatus::UNAUTHORIZED),
			419 => Ok(EScenarioStatus::SESSION_EXPIRED),
			500 => Ok(EScenarioStatus::SYSTEM_ERROR),
			_ => Err(D::Error::custom("incorrect scenario status")),
		}
	}
}

impl Serialize for EScenarioStatus {
	fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
	where
		S: Serializer,
	{
		let numval: u16 = match self {
			EScenarioStatus::SCENARIO_SUCCESS => 0,
			EScenarioStatus::SCENARIO_FAIL => 400,
			EScenarioStatus::UNAUTHORIZED => 401,
			EScenarioStatus::SESSION_EXPIRED => 419,
			EScenarioStatus::SYSTEM_ERROR => 500,
		};

		serializer.serialize_u16(numval)
	}
}
