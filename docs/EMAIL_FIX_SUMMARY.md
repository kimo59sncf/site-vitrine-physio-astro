# Résumé des corrections pour l'envoi d'emails

## Problème identifié

L'utilisateur a signalé que les soumissions du formulaire de réservation renvoyaient un succès mais qu'aucun email n'était reçu.

**Problème supplémentaire découvert :** Les fichiers joints (ordonnances) n'étaient pas envoyés correctement - seul le chemin du fichier était affiché dans l'email, mais le fichier n'était pas attaché ni téléchargeable.

## Diagnostic

### 1. Erreur 413 Request Entity Too Large
**Erreur détectée :** `POST https://physiokbnyon.ch/api/booking 413 (Request Entity Too Large)`

**Cause :** Le fichier joint (ordonnance) de 4.2 Mo dépassait la limite par défaut de Nginx (1 Mo).

**Preuve dans les logs Nginx :**
```
2026/01/27 15:15:39 [error] 649021#649021: *49 client intended to send too large body: 4243457 bytes
```

### 2. Configuration SMTP incorrecte
**Problème :** Le code utilisait le port 587 (STARTTLS) au lieu du port 465 (SSL/TLS direct) pour Infomaniak.

**Configuration originale :**
```javascript
{
  host: 'mail.infomaniak.com',
  port: 587,
  secure: false,
}
```

**Configuration corrigée :**
```javascript
{
  host: 'mail.infomaniak.com',
  port: 465,
  secure: true,
  tls: { rejectUnauthorized: false }
}
```

### 3. Gestion silencieuse des erreurs
**Problème :** Les erreurs d'envoi d'email étaient catchées mais ignorées, continuant l'exécution du code.

**Code original :**
```javascript
} catch (emailError) {
  console.error('Erreur envoi email:', emailError);
  // Continue without failing the request
}
```

**Code corrigé :**
```javascript
} catch (emailError) {
  console.error('Erreur envoi email:', emailError);
  console.error('Détails de l\'erreur:', emailError instanceof Error ? emailError.message : String(emailError));
  
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
```

### 4. Fichiers joints non attachés
**Problème :** Les fichiers d'ordonnance n'étaient ni sauvegardés sur le serveur ni attachés à l'email. Seul le chemin du fichier était affiché dans l'email.

**Code original :**
```javascript
if (prescription) {
  const timestamp = Date.now();
  const filename = `prescription_${timestamp}_${prescription.name}`;
  await prescription.arrayBuffer(); // Pas de sauvegarde !
  prescriptionPath = `/uploads/${filename}`;
}
```

**Code corrigé :**
```javascript
if (prescription) {
  const timestamp = Date.now();
  const filename = `prescription_${timestamp}_${prescription.name}`;
  
  // Créer le dossier uploads s'il n'existe pas
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Sauvegarder le fichier
  const filePath = path.join(uploadsDir, filename);
  const arrayBuffer = await prescription.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);
  
  prescriptionPath = `/uploads/${filename}`;
  prescriptionAttachment = {
    filename: prescription.name,
    path: filePath,
  };
}
```

**Email avec pièce jointe :**
```javascript
const mailOptions = {
  from: 'contact@physiokbnyon.ch',
  to: 'contact@physiokbnyon.ch',
  subject: 'Nouvelle demande de rendez-vous ou informations',
  html: `...`,
  attachments: prescriptionAttachment ? [prescriptionAttachment] : [],
};
```

## Modifications apportées

### 1. Configuration Nginx (`/etc/nginx/sites-available/physiokbnyon.ch`)
```nginx
server {
    server_name physiokbnyon.ch www.physiokbnyon.ch;

    # Augmenter la limite de taille des fichiers uploadés (20MB)
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        # ... reste de la configuration
    }
}
```

### 2. API de réservation (`src/pages/api/booking.ts`)
- Changement du port SMTP de 587 à 465
- Ajout de `secure: true` pour SSL/TLS
- Ajout de logs détaillés pour le débogage
- Retour d'erreur explicite au client en cas d'échec d'envoi d'email
- **Sauvegarde des fichiers joints** dans `public/uploads`
- **Attachement des fichiers** aux emails avec nodemailer
- Import des modules `fs` et `path` pour la gestion des fichiers

## Actions effectuées

1. ✅ Mise à jour de la configuration Nginx avec `client_max_body_size 20M`
2. ✅ Rechargement de Nginx (`sudo systemctl reload nginx`)
3. ✅ Correction de la configuration SMTP (port 465, SSL)
4. ✅ Amélioration des logs et gestion des erreurs
5. ✅ **Sauvegarde des fichiers joints sur le serveur**
6. ✅ **Attachement des fichiers aux emails**
7. ✅ Création du dossier `public/uploads` sur le serveur
8. ✅ Redémarrage du conteneur Docker de l'application

## Tests recommandés

1. **Test sans fichier joint :** Soumettre le formulaire sans ordonnance pour vérifier que l'email est bien envoyé
2. **Test avec fichier joint :** Soumettre avec une ordonnance de moins de 20 Mo
3. **Vérification des logs :** Surveiller les logs Docker et Nginx pour confirmer l'envoi d'email

```bash
# Logs de l'application
docker logs physio-site-container -f

# Logs Nginx
sudo tail -f /var/log/nginx/error.log
```

## Configuration SMTP Infomaniak

Pour référence, voici les paramètres SMTP corrects pour Infomaniak :
- **Hôte :** mail.infomaniak.com
- **Port :** 465 (SSL) ou 587 (STARTTLS)
- **Sécurité :** SSL/TLS
- **Authentification :** Requise
- **Utilisateur :** contact@physiokbnyon.ch
- **Mot de passe :** [Mot de passe de l'email]

## Prochaines étapes

Si les emails ne sont toujours pas reçus après ces corrections :

1. Vérifier les logs de l'application pour les erreurs SMTP détaillées
2. Tester la connexion SMTP directement depuis le serveur
3. Vérifier les paramètres de sécurité Infomaniak (IP autorisées, 2FA, etc.)
4. Consulter les logs d'envoi d'Infomaniak si disponibles
