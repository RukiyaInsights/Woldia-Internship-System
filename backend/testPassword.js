const pool = require("./config/db");
const bcrypt = require("bcryptjs");

async function testPassword() {
    try {
        const email = "srawerk9050@intern.com";

        const [rows] = await pool.query(
            "SELECT password FROM users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            console.log("Account not found.");
            return;
        }

        const storedHash = rows[0].password;

        console.log(
            "Valid bcrypt format:",
            /^\$2[aby]\$\d{2}\$/.test(storedHash)
        );

        const enteredPassword = await askForPassword();

        const matches = await bcrypt.compare(
            enteredPassword,
            storedHash
        );

        console.log("Password matches stored hash:", matches);
    } catch (error) {
        console.error("Test error:", error.message);
    } finally {
        await pool.end();
    }
}

function askForPassword() {
    const readline = require("readline");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question("Enter the password you used when registering: ", (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

testPassword();