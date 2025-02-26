require("dotenv").config();

const { spawn } = require("child_process");

const vite = spawn("vite", {
	stdio: "inherit",
	shell: true,
});

vite.on("close", (code) => {
	console.log(`Vite завершился с кодом ${code}`);
});
