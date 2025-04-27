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

"$@"
