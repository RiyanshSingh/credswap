import { sendEmail } from "./src/lib/email.ts";

async function test() {
    console.log("Testing email from frontend utility...");
    const result = await sendEmail({
        type: "welcome",
        payload: {
            name: "Test Admin",
            email: "itsyourriyansh@gmail.com"
        }
    });
    console.log("Result:", result);
}

test();
