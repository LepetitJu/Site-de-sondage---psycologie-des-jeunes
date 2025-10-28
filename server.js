const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.')); // Servir les fichiers statiques

// Fichier pour stocker les réponses
const DATA_FILE = 'responses.json';

// Initialiser le fichier s'il n'existe pas
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ responses: [] }, null, 2));
}

// Route pour soumettre les réponses
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

// Route pour récupérer toutes les réponses (optionnel - pour consultation)
app.get('/api/responses', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        res.json(data);
    } catch (error) {
        console.error('Erreur lors de la lecture:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour obtenir les statistiques (optionnel)
app.get('/api/stats', (req, res) => {
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
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📊 Les réponses sont sauvegardées dans ${DATA_FILE}`);
});