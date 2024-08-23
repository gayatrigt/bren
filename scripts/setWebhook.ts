import { setWebhook } from "../src/pages/api/telegramWebhook";


async function main() {
    try {
        await setWebhook();
        console.log('Webhook set successfully');
    } catch (error) {
        console.error('Error setting webhook:', error);
    }
    process.exit(0);
}

main();