import { Resend } from 'resend';

const resend = new Resend('re_7kzHjct5_oKNMz5ACcQYsPYwyvHPmzxgM');

async function sendTest() {
    console.log('🚀 Attempting to send test email...');
    const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'xumai.test@gmail.com',
        subject: 'Hello World - XUM AI Test',
        html: '<p>Congrats on sending your <strong>first email</strong> for XUM AI!</p>'
    });

    if (error) {
        return console.error('❌ Error:', error);
    }

    console.log('✅ Success! Email sent:', data);
}

sendTest();
