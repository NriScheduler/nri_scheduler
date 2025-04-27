# nri_scheduler
my outstanding trpg scheduler

## steps to start a local development
- install [docker](https://docs.docker.com), [rust](https://www.rust-lang.org/tools/install), [node.js](https://nodejs.org/en)
- clone the repository ¯\\\_(ツ)_/¯
- exec `cargo test` to enable git hooks
- exec `rustup toolchain install nightly` to be able check all fmt features
- exec `cp env.example .env`
- fill the `.env` file with values
- exec `docker compose up` to start a database
- exec `./scripts.sh x25519` to generate a key pair
- exec `./scripts.sh dev` to start an axum server
- exec `npm ci` to install client dependencies
- exec `npm run dev` to start a client
- open a brouser at `http://localhost:{APP_PORT}` (to avoid cors problems for api calls)

## git hooks
remove a `target` directory (if exists) and run `cargo test` to enable git hooks.  
repeat it again to enable some changes in your hook files.
