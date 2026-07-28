import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Dossier de persistance (volume Docker monte sur /app/data en production)
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.jsonl');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

function ensureDataDirs() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
}

async function persistBooking(booking: Record<string, unknown>) {
  try {
    ensureDataDirs();
    await fs.promises.appendFile(BOOKINGS_FILE, JSON.stringify(booking) + '\n', 'utf8');
  } catch (err) {
    // Ne jamais bloquer la demande client si la persistance echoue
    console.error('Erreur persistance booking:', err);
  }
}

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

    let prescriptionFile: string | null = null;
    let prescriptionAttachment = null;
    if (prescription && prescription.size > 0) {
      // Limite de securite : 10 Mo max
      if (prescription.size > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'File too large (max 10 MB)' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const timestamp = Date.now();
      const filename = `prescription_${timestamp}_${sanitizeFilename(prescription.name)}`;

      // Sauvegarde HORS du dossier public (donnees de sante confidentielles)
      ensureDataDirs();
      const filePath = path.join(UPLOADS_DIR, filename);
      const arrayBuffer = await prescription.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.promises.writeFile(filePath, buffer);

      prescriptionFile = filename;
      prescriptionAttachment = {
        filename: prescription.name,
        path: filePath,
      };
      console.log(`Fichier sauvegardé: ${prescription.name} (${prescription.size} bytes) -> ${filePath}`);
    }

    const booking = {
      id: `REQUEST_${Date.now()}`,
      name,
      email,
      phone,
      reason,
      message: message || '',
      prescriptionFile,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      createdAt: new Date().toISOString(),
      status: 'received',
    };

    console.log('Nouvelle demande:', booking.id);

    // Persistance de la demande (historique consultable sur /admin)
    await persistBooking(booking);

    // Send email
    try {
      const smtpHost = process.env.SMTP_HOST || 'mail.infomaniak.com';
      const smtpPort = Number(process.env.SMTP_PORT || 465);
      const smtpUser = process.env.SMTP_USER || 'contact@physiokbnyon.ch';
      const smtpPass = process.env.SMTP_PASS;

      if (!smtpPass) {
        console.error('SMTP_PASS non configuré : email non envoyé (demande persistée)');
      } else {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        const contactEmail = process.env.CONTACT_EMAIL || 'contact@physiokbnyon.ch';
        const mailOptions = {
          from: smtpUser,
          to: contactEmail,
          subject: 'Nouvelle demande de rendez-vous ou informations',
          html: `
            <h2>Nouvelle demande reçue</h2>
            <p><strong>Nom:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Téléphone:</strong> ${phone}</p>
            <p><strong>Motif:</strong> ${reason}</p>
            <p><strong>Message:</strong> ${message || 'Aucun'}</p>
            ${prescriptionFile ? `<p><strong>Ordonnance:</strong> Voir pièce jointe</p>` : ''}
          `,
          attachments: prescriptionAttachment ? [prescriptionAttachment] : [],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email envoyé avec succès:', info.messageId);
      }
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email sending failed',
          message: emailError instanceof Error ? emailError.message : 'Unknown email error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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
