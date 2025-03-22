mod errors;
mod response;
mod scenario_status;

pub(crate) use errors::AppError;
pub(crate) use response::AppResponse;

pub(crate) type AppResult = Result<AppResponse, AppError>;
pub(crate) type CoreResult<T = ()> = Result<T, AppError>;
