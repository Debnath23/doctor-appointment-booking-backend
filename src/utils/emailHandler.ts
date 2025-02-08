import { Resend } from 'resend';

// const apiKey = process.env.RESEND_EMAIL_API_KEY;

// if (!apiKey) {
//   throw new Error('Missing RESEND_EMAIL_API_KEY.');
// }

const resend = new Resend('re_ADazm5YP_KR4Wr9oyUheUe3R1PwawyEqU');

export const EmailHandler = async (
  email: string,
  subject: string,
  appointment: any,
) => {
  try {
    await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: [email],
      subject: subject,
      html: `<h1>Bookify</h1>
      <p>Appointment Details:</p>
      <p>Appointment Date : ${appointment.appointmentDate.toLocaleDateString()}</p>
      <p>Appointment Time : ${appointment.appointmentTime}</p>
      <p>Thank you for choosing Bookify!`,
    });
  } catch (error) {
    throw error;
  }
};
