#!/bin/sh

build() {
	cargo build --release;
}

dev() {
	export $(cat .env | grep -v '^#' | xargs) && cargo run --features=vite
}

start_release() {
	export $(cat .env | grep -v '^#' | xargs) && ./target/release/nri_scheduler
}

start() {
	build;
	start_release;
}

test() {
	export $(cat .env | grep -v '^#' | xargs) && cargo test
}

bin() {
	export $(cat .env | grep -v '^#' | xargs) && cargo run --bin workflow
}

check() {
	(cargo check && echo "check is ok") || exit 1;
}

clippy() {
	(cargo clippy --workspace --all-features --tests -- -D warnings && echo "clippy is ok") || exit 1;
}

fmt() {
	(cargo +nightly fmt -- --check && echo "fmt is ok") || exit 1;
}

lint() {
	clippy && fmt;
}

full_check() {
	check && clippy && fmt;
}

ecdsa() {
	openssl ecparam -genkey -noout -name prime256v1 | openssl pkcs8 -topk8 -nocrypt -out private_key.pem
	openssl ec -in private_key.pem -pubout -out public_key.pem
}

ed25519() {
	openssl genpkey -algorithm ED25519 -out private_key.pem;
	openssl pkey -in private_key.pem -pubout -out public_key.pem;
}

x25519() {
	openssl genpkey -algorithm X25519 -out private_key.pem;
	openssl pkey -in private_key.pem -pubout -out public_key.pem;
}

cert() {
	openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
}

# cargo clippy --  -D clippy::pedantic
# - clippy (everything that has no false positives)
# - clippy_pedantic (everything)
# - clippy_nursery (new lints that aren't quite ready yet)
# - clippy_style (code that should be written in a more idiomatic way)
# - clippy_complexity (code that does something simple but in a complex way)
# - clippy_perf (code that can be written in a faster way)
# - clippy_cargo (checks against the cargo manifest)
# - clippy_correctness (code that is just outright wrong or very very useless)

"$@"
