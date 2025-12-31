import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const POST: APIRoute = async ({ request }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const reason = formData.get('reason') as string;
    const message = formData.get('message') as string;
    const prescription = formData.get('prescription') as File | null;

    if (!name || !email || !phone) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let prescriptionPath = null;
    if (prescription) {
      const timestamp = Date.now();
      const filename = `prescription_${timestamp}_${prescription.name}`;
      await prescription.arrayBuffer();
      prescriptionPath = `/uploads/${filename}`;
      console.log(`Fichier reçu: ${prescription.name} (${prescription.size} bytes)`);
    }

    const booking = {
      id: `REQUEST_${Date.now()}`,
      name,
      email,
      phone,
      reason,
      message,
      prescriptionPath,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    console.log('Nouvelle demande:', booking);

    // Send email
    try {
      const transporter = nodemailer.createTransport({
        host: 'mail.infomaniak.com',
        port: 587,
        secure: false,
        auth: {
          user: 'contact@physiokbnyon.ch',
          pass: '%U-7rk7&Flo!noAT',
        },
      });

      const mailOptions = {
        from: 'contact@physiokbnyon.ch',
        to: 'contact@physiokbnyon.ch',
        subject: 'Nouvelle demande de rendez-vous ou informations',
        html: `
          <h2>Nouvelle demande reçue</h2>
          <p><strong>Nom:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Téléphone:</strong> ${phone}</p>
          <p><strong>Motif:</strong> ${reason}</p>
          <p><strong>Message:</strong> ${message || 'Aucun'}</p>
          ${prescriptionPath ? `<p><strong>Ordonnance:</strong> ${prescriptionPath}</p>` : ''}
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log('Email envoyé avec succès');
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
      // Continue without failing the request
    }

    // TODO: Send WhatsApp message (requires API setup)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Request submitted successfully',
        requestId: booking.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
