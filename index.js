const express = require('express');
const app = express();
const PORT = 3000;
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Créer le dossier uploads s'il n'existe pas
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuration du stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Configuration Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rakotomalalasoloheryalain@gmail.com',
    pass: 'gcdopvtbvowupdgr'
  }
});

// Email de destination
const RECIPIENT_EMAIL = 'rakotomalalasoloheryalain@gmail.com';

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.send('Serveur portfolio en fonctionnement !');
});

// Route pour l'envoi d'email
app.post('/api/send-email', upload.single('file'), async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const file = req.file;

    // Validation des données
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'Tous les champs sont obligatoires' 
      });
    }

    // Configuration de l'email
    const mailOptions = {
      from: `"Portfolio Contact" <rakotomalalasoloheryalain@gmail.com>`,
      to: RECIPIENT_EMAIL,
      subject: subject,
      text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html: `
        <h2>Nouveau message depuis votre portfolio</h2>
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Objet:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      attachments: file ? [{
        filename: file.originalname,
        path: file.path
      }] : []
    };

    // Envoi de l'email
    await transporter.sendMail(mailOptions);

    // Suppression du fichier après envoi
    if (file) {
      fs.unlinkSync(file.path);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Message envoyé avec succès' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi du message',
      error: error.message 
    });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur http://localhost:${PORT}`);
  console.log('Configuration email activée');
});