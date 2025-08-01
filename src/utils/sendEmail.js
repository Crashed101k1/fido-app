// Utilidad para enviar correo usando EmailJS
import emailjs from 'emailjs-com';

export async function sendContactEmail({ name, email, message }) {
  // Reemplaza estos valores por los tuyos de EmailJS
  const serviceID = 'service_wjdk6jo';
  const templateID = 'template_gtcthhb';
  const userID = 'fjNFdsfw5wAU5YGRv';

  const templateParams = {
    from_name: name,
    from_email: email,
    message: message,
  };

  return emailjs.send(serviceID, templateID, templateParams, userID);
}
