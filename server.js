const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== CONFIGURATION AUTHENTIFICATION ==========
// ⚠️ CHANGE CES IDENTIFIANTS !
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
// ====================================================

// Middleware
app.use(express.json());

// Middleware d'authentification HTTP Basic pour les routes admin
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Authentification requise');
    }
    
    // Décoder les identifiants
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    
    // Vérifier les identifiants
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Identifiants incorrects');
    }
}

// Route protégée pour admin.html
app.get('/admin.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Route protégée pour /admin
app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Middleware pour servir les fichiers statiques (tout sauf admin.html est servi normalement)
app.use(express.static('.', { index: false }));

// Route protégée pour admin.html
app.get('/admin.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Route protégée pour /admin
app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Fichier pour stocker les réponses
const DATA_FILE = 'responses.json';

// Initialiser le fichier s'il n'existe pas
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ responses: [] }, null, 2));
}

// Route pour la page d'accueil (formulaire)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route pour soumettre les réponses (PUBLIQUE)
app.post('/api/submit', (req, res) => {
    try {
        const response = req.body;
        
        // Validation basique
        if (!response.age || !response.genre || !response.bien_etre_mental) {
            return res.status(400).json({ error: 'Champs obligatoires manquants' });
        }
        
        // Lire les données existantes
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        
        // Ajouter un ID unique
        response.id = Date.now().toString();
        
        // Ajouter la nouvelle réponse
        data.responses.push(response);
        
        // Sauvegarder
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        
        console.log(`Nouvelle réponse enregistrée (ID: ${response.id})`);
        
        res.json({ 
            success: true, 
            message: 'Réponse enregistrée avec succès',
            id: response.id
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route PROTÉGÉE pour récupérer toutes les réponses
app.get('/api/responses', requireAuth, (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        res.json(data);
    } catch (error) {
        console.error('Erreur lors de la lecture:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route PROTÉGÉE pour obtenir les statistiques
app.get('/api/stats', requireAuth, (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const responses = data.responses;
        
        const stats = {
            total: responses.length,
            age_moyen: responses.length > 0 
                ? (responses.reduce((sum, r) => sum + parseInt(r.age), 0) / responses.length).toFixed(1)
                : 0,
            stress_moyen: responses.length > 0
                ? (responses.reduce((sum, r) => sum + parseInt(r.stress), 0) / responses.length).toFixed(1)
                : 0,
            sommeil_moyen: responses.length > 0
                ? (responses.reduce((sum, r) => sum + parseFloat(r.sommeil), 0) / responses.length).toFixed(1)
                : 0
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Erreur lors du calcul des stats:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur https://site-de-sondage-psycologie-des-jeunes.onrender.com/`);
    console.log(`📊 Les réponses sont sauvegardées dans ${DATA_FILE}`);
    console.log(`🔒 Page admin protégée - Login: ${ADMIN_USERNAME}`);
    console.log(`⚠️  ATTENTION: Change le mot de passe dans le code ou via variables d'environnement !`);
});
