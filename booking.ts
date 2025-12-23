import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Vérifier que la requête est POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Récupérer les données du formulaire
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const reason = formData.get('reason') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const prescription = formData.get('prescription') as File | null;

    // Validation basique
    if (!name || !email || !phone || !reason || !date || !time) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Traitement du fichier d'ordonnance (si présent)
    let prescriptionPath = null;
    if (prescription) {
      // Créer un nom de fichier unique
      const timestamp = Date.now();
      const filename = `prescription_${timestamp}_${prescription.name}`;
      
      // Convertir le fichier en buffer
      const buffer = await prescription.arrayBuffer();
      
      // Ici, vous pouvez:
      // 1. Sauvegarder le fichier sur le serveur
      // 2. L'envoyer à un service de stockage (S3, etc.)
      // 3. Le traiter d'une autre manière
      
      // Pour cet exemple, nous simulons juste le traitement
      prescriptionPath = `/uploads/${filename}`;
      
      console.log(`Fichier reçu: ${prescription.name} (${prescription.size} bytes)`);
    }

    // Créer l'objet de réservation
    const booking = {
      id: `BOOKING_${Date.now()}`,
      name,
      email,
      phone,
      reason,
      date,
      time,
      prescriptionPath,
      createdAt: new Date().toISOString(),
      status: 'pending', // À traiter par l'administrateur
    };

    // Ici, vous pouvez:
    // 1. Sauvegarder dans une base de données
    // 2. Envoyer un email de confirmation
    // 3. Envoyer une notification au cabinet
    // 4. Intégrer avec un système de calendrier

    // Simulation: Enregistrement en console
    console.log('Nouvelle réservation:', booking);

    // Envoyer un email de confirmation (simulation)
    // await sendConfirmationEmail(email, booking);

    // Envoyer une notification au cabinet (simulation)
    // await notifyClinic(booking);

    // Répondre avec succès
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking created successfully',
        bookingId: booking.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing booking:', error);
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
