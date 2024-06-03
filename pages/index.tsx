// Importation des bibliothèques React et des hooks nécessaires
import React, { useEffect, useRef, useState } from 'react';

// Importation de la bibliothèque marked pour convertir le markdown en HTML
import { marked } from 'marked';

import ResizeDetector from 'react-resize-detector';

// Définition d'une interface TypeScript pour les messages du chat
interface ChatBubble {
  type: 'question' | 'response'; // Le type du message : "question" ou "response"
  text: string; // Le contenu du message sous forme de chaîne de caractères
}

// Définition d'une classe pour gérer la logique du chatbot et la communication avec l'API
class ChatApp {
  description: string; // Stocke la description du chatbot
  apiKey: string; // Clé API pour l'accès à l'API du chatbot
  apiUrl: string; // URL de l'API pour envoyer des requêtes
  generationConfig: any; // Configuration pour la génération de contenu par le chatbot
  safetySettings: any[]; // Paramètres de sécurité pour le contenu généré par le chatbot

  // Constructeur de la classe pour initialiser les propriétés
  constructor() {
    this.description = ''; // Initialisation de la description à une chaîne vide
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY; // Initialisation de la clé API
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent'; // Initialisation de l'URL de l'API
    this.generationConfig = {
      temperature: 0.1, // Température pour la génération de contenu (contrôle la créativité du chatbot)
      topP: 0.1, // Paramètre topP pour la génération de contenu (contrôle la diversité des résultats)
      topK: 1, // Paramètre topK pour la génération de contenu (limite le nombre de résultats parmi lesquels choisir)
      maxOutputTokens: 8192, // Nombre maximal de tokens (mots ou morceaux de mots) générés dans la réponse
      responseMimeType: "text/plain", // Type MIME de la réponse (ici, du texte brut)
    };
    this.safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }, // Paramètre de sécurité pour le harcèlement
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" }, // Paramètre de sécurité pour les discours haineux
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }, // Paramètre de sécurité pour le contenu sexuellement explicite
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }, // Paramètre de sécurité pour le contenu dangereux
    ];
  }

  // Méthode pour récupérer la description du chatbot depuis un fichier
  async fetchDescription(): Promise<void> {
    try {
      // Récupération du fichier descriptionStartop.txt depuis le serveur
      const response = await fetch('/descriptionStartop.txt');
      if (!response.ok) {
        // Si la réponse n'est pas OK (statut HTTP non 200), lancer une erreur
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Lecture du contenu du fichier comme du texte
      const text = await response.text();
      // Assignation du texte à la description du chatbot
      this.description = text;
      // Affichage de la description dans la console pour vérification
      console.log('Description loaded:', this.description);
    } catch (err) {
      // Affichage des erreurs éventuelles dans la console
      console.error('Failed to load description:', err);
    }
  }

  // Méthode pour échapper les caractères spéciaux dans une chaîne de caractères
  escapeString(str: string): string {
    return str.replace(/\\/g, '\\\\') // Remplacement des antislashs par des doubles antislashs
              .replace(/"/g, '\\"') // Remplacement des guillemets doubles par des guillemets doubles échappés
              .replace(/'/g, "\\'") // Remplacement des guillemets simples par des guillemets simples échappés
              .replace(/\n/g, '')  // Suppression des caractères de nouvelle ligne
              .replace(/\r/g, '\\r') // Remplacement des retours chariot par des retours chariot échappés
              .replace(/\t/g, '\\t'); // Remplacement des tabulations par des tabulations échappées
  }

  // Méthode pour envoyer un message à l'API et obtenir une réponse
  async sendMessage(inputText: string, conversationHistory: ChatBubble[]): Promise<string> {
    // Échappement de la description, du texte d'entrée et de l'historique de la conversation
    const escapedDescription = this.escapeString(this.description);
    const escapedInputText = this.escapeString(inputText);
    const escapedHistory = conversationHistory.map(bubble => ({
      ...bubble,
      text: this.escapeString(bubble.text) // Échappement du texte de chaque message dans l'historique
    }));

    const currentDate = new Date().toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});

    // Construction du corps de la requête à envoyer à l'API
    const requestBody = {
      contents: [
        // Ajout de la description et de l'instruction pour une réponse courte
        { role: "user", parts: [{ text: escapedDescription + " Je réponds avec une courte description, réponse très simple et courte seulement. Date actuelle: " + currentDate}] },
        { role: "model", parts: [{ text: "Je suis votre aide Startop et je répond à toutes vos questions en lien avec Startop. Je réponds en une phrase seulement avec une courte description, mes réponses sont très courtes et simples. Date actuelle: " + currentDate}] },
        // Ajout de l'historique des messages
        ...escapedHistory.map(bubble => ({
          role: bubble.type === 'question' ? "user" : "model",
          parts: [{ text: bubble.text }]
        })),
        // Ajout du nouveau message de l'utilisateur
        { role: "user", parts: [{ text: escapedInputText }] },
      ],
      generationConfig: this.generationConfig, // Ajout de la configuration de génération
      safetySettings: this.safetySettings, // Ajout des paramètres de sécurité
    };

    try {
      // Envoi de la requête à l'API
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST', // Méthode POST pour envoyer des données
        headers: { 'Content-Type': 'application/json' }, // En-têtes de la requête pour indiquer le type de contenu
        body: JSON.stringify(requestBody) // Corps de la requête converti en JSON
      });

      // Conversion de la réponse en JSON
      const data = await response.json();
      // Affichage de la réponse dans la console pour vérification
      console.log('API response:', data);

      // Vérification de la structure de la réponse pour s'assurer qu'elle est valide
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid API response structure'); // Gestion des erreurs de structure de la réponse
      }

      // Construction du texte de réponse à partir des parties de contenu
      const responseText = data.candidates[0].content.parts.map((part: any) => part.text).join(' ');
      return responseText; // Retour de la réponse textuelle
    } catch (error) {
      console.error('Error:', error); // Affichage des erreurs dans la console
      return 'Error fetching response'; // Message d'erreur de retour en cas de problème
    }
  }
}

// Composant fonctionnel React pour le chatbot
const ChatBotSimpleApi: React.FC = () => {
  // Déclaration des états pour gérer les messages, la valeur d'entrée, l'historique des conversations et l'instance de ChatApp
  const [messages, setMessages] = useState<ChatBubble[]>([]); // État pour stocker les messages du chat, initialisé à une liste vide
  const [inputValue, setInputValue] = useState<string>(''); // État pour stocker la valeur actuelle du champ de saisie, initialisé à une chaîne vide
  const [conversationHistory, setConversationHistory] = useState<ChatBubble[]>([]); // État pour stocker l'historique des conversations, initialisé à une liste vide
  const [chatApp, setChatApp] = useState<ChatApp | null>(null); // État pour stocker l'instance de ChatApp, initialisé à null
  const [isMinimized, setIsMinimized] = useState<boolean>(false); // État pour gérer la minimisation de la fenêtre du chat, initialisé à false
  const messagesEndRef = useRef<HTMLDivElement>(null); // Référence pour le défilement automatique vers le bas des messages
  const containerRef = useRef<HTMLDivElement>(null); // Référence pour le conteneur principal du chat
  const resizeHandleRef = useRef<HTMLDivElement>(null); // Référence pour la poignée de redimensionnement du conteneur

  // Hook useEffect pour initialiser l'application de chat et charger la description au montage du composant
  useEffect(() => {
    const app = new ChatApp(); // Création d'une nouvelle instance de ChatApp
    app.fetchDescription().then(() => {
      setChatApp(app); // Initialisation de l'instance de ChatApp et stockage dans l'état
    });

    // Définir l'arrière-plan pour tout le corps du document
    document.body.style.backgroundImage = 'url(/startopcapture.png)'; // Définition de l'image d'arrière-plan
    document.body.style.backgroundSize = 'cover'; // L'image couvre toute la zone
    document.body.style.backgroundPosition = 'center'; // L'image est centrée
    document.body.style.backgroundRepeat = 'no-repeat'; // Pas de répétition de l'image
    document.body.style.height = '100vh'; // La hauteur du corps est de 100% de la hauteur de la fenêtre
    document.body.style.margin = '0'; // Pas de marge autour du corps
    document.body.style.fontFamily = 'Lato, sans-serif'; // Police de caractère utilisée

    // Nettoyage du style lors du démontage du composant
    return () => {
      document.body.style.backgroundImage = ''; // Suppression de l'image d'arrière-plan
      document.body.style.backgroundSize = ''; // Réinitialisation de la taille de l'image
      document.body.style.backgroundPosition = ''; // Réinitialisation de la position de l'image
      document.body.style.backgroundRepeat = ''; // Réinitialisation de la répétition de l'image
      document.body.style.height = ''; // Réinitialisation de la hauteur du corps
      document.body.style.margin = ''; // Réinitialisation de la marge autour du corps
      document.body.style.fontFamily = ''; // Réinitialisation de la police de caractère
    };
  }, []); // Le tableau vide signifie que ce useEffect ne s'exécute qu'une seule fois au montage du composant

  // Hook useEffect pour faire défiler vers le bas des messages lorsqu'ils changent
  useEffect(() => {
    const messagesDiv = document.getElementById('messages'); // Récupération de l'élément DOM par son ID
    if (messagesDiv) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight; // Défilement vers le bas pour afficher le dernier message
    }
  }, [messages]); // Ce useEffect se déclenche chaque fois que l'état messages change

  // Fonction pour gérer l'envoi des messages
  const handleSendMessage = async () => {
    if (inputValue.trim() !== '') { // Vérifie que la valeur d'entrée n'est pas vide ou uniquement des espaces
      const newUserMessage: ChatBubble = { type: 'question', text: inputValue }; // Crée un nouvel objet message pour l'utilisateur

      setMessages((prevMessages) => [...prevMessages, newUserMessage]); // Ajoute le message de l'utilisateur à la liste des messages
      setConversationHistory((prevHistory) => [...prevHistory, newUserMessage]); // Ajoute le message de l'utilisateur à l'historique

      setInputValue(''); // Réinitialise la valeur du champ de saisie à une chaîne vide

      if (chatApp) {
        // Envoie le message à l'API et obtient la réponse du chatbot
        const responseText = await chatApp.sendMessage(inputValue, [...conversationHistory, newUserMessage]);
        const newBotMessage: ChatBubble = { type: 'response', text: responseText }; // Crée un nouvel objet message pour la réponse du bot

        setMessages((prevMessages) => [...prevMessages, newBotMessage]); // Ajoute la réponse du bot à la liste des messages
        setConversationHistory((prevHistory) => [...prevHistory, newBotMessage]); // Ajoute la réponse du bot à l'historique
      }
    }
  };

  // Fonction pour gérer l'appui sur les touches dans le champ de saisie
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Si la touche "Enter" est pressée sans "Shift"
      e.preventDefault(); // Empêche le comportement par défaut du navigateur
      handleSendMessage(); // Appelle la fonction pour envoyer le message
    } else if (e.key === 'Enter' && e.shiftKey) { // Si la touche "Enter" est pressée avec "Shift"
      e.preventDefault(); // Empêche le comportement par défaut du navigateur
      setInputValue(inputValue + '\n'); // Ajoute une nouvelle ligne au texte d'entrée
    }
  };

  // Fonction pour convertir le texte en markdown en HTML
  const renderMarkdown = (text: string) => {
    const formattedText = text.replace(/(\n|^)(\* )/g, '$1\n$2'); // Formate le texte pour le markdown
    const html = marked(formattedText); // Convertit le texte en HTML
    return { __html: html }; // Retourne un objet avec le HTML pour affichage
  };

  // Fonction pour gérer le redimensionnement du conteneur
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = containerRef.current; // Récupère la référence du conteneur
    const resizeHandle = resizeHandleRef.current; // Récupère la référence de la poignée de redimensionnement
    if (container && resizeHandle && e.target === resizeHandle) { // Vérifie que les références existent et que l'élément cible est la poignée
      const startX = e.clientX; // Enregistre la position de départ de la souris sur l'axe X
      const startY = e.clientY; // Enregistre la position de départ de la souris sur l'axe Y
      const startWidth = container.offsetWidth; // Enregistre la largeur de départ du conteneur
      const startHeight = container.offsetHeight; // Enregistre la hauteur de départ du conteneur

      // Fonction pour gérer le déplacement de la souris
      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = startWidth + (startX - e.clientX); // Calcule la nouvelle largeur en fonction du déplacement de la souris
        const newHeight = startHeight + (startY - e.clientY); // Calcule la nouvelle hauteur en fonction du déplacement de la souris
        container.style.width = `${newWidth}px`; // Applique la nouvelle largeur au conteneur
        container.style.height = `${newHeight}px`; // Applique la nouvelle hauteur au conteneur
      };

      // Fonction pour arrêter le redimensionnement
      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove); // Supprime l'écouteur d'événement pour le déplacement de la souris
        window.removeEventListener('mouseup', handleMouseUp); // Supprime l'écouteur d'événement pour l'arrêt du redimensionnement
      };

      window.addEventListener('mousemove', handleMouseMove); // Ajoute l'écouteur d'événement pour le déplacement de la souris
      window.addEventListener('mouseup', handleMouseUp); // Ajoute l'écouteur d'événement pour l'arrêt du redimensionnement
    }
  };

  // Fonction pour gérer la minimisation du conteneur
  const handleMinimize = () => {
    setIsMinimized(!isMinimized); // Inverse l'état de minimisation (si minimisé, le ré-agrandit, sinon, le minimise)
  };

  // Rendu du composant React
  return (
    
    <div ref={containerRef} style={{ ...styles.container, ...(isMinimized ? styles.containerMinimized : {}) }}>
      <div ref={resizeHandleRef} style={styles.resizeHandle} onMouseDown={handleMouseDown}></div>
      <div style={styles.header}>
        <span>Assistant Startop</span>
        <button onClick={handleMinimize} style={styles.minimizeButton}>{isMinimized ? '➕' : '➖'}</button>
      </div>
      {!isMinimized && (
        <>
          <div style={styles.messages} id="messages">
            {messages.map((msg, index) => (
              <div key={index} style={msg.type === 'question' ? styles.userBubble : styles.botBubble} dangerouslySetInnerHTML={renderMarkdown(msg.text)} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div style={styles.inputContainer}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Entrez votre message ici"
              style={styles.input}
            />
            <button onClick={handleSendMessage} style={styles.button}>Envoyer</button>
          </div>
        </>
      )}
    </div>
  );
};

// Styles pour les composants
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed', // Position fixe dans la fenêtre
    bottom: '20px', // À 20px du bas de la fenêtre
    right: '20px', // À 20px de la droite de la fenêtre
    width: '475px', // Largeur du conteneur
    height: '647px', // Hauteur du conteneur
    backgroundColor: '#f1f4f6', // Couleur de fond blanche
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', // Ombre du conteneur
    borderRadius: '8px', // Bords arrondis
    padding: '10px', // Padding intérieur
    zIndex: 1000, // Niveau de profondeur dans la pile de contexte
    overflow: 'auto', // Activation du défilement si nécessaire
    display: 'flex', // Utilisation de flexbox pour l'alignement des enfants
    flexDirection: 'column', // Alignement vertical des enfants
  },
  containerMinimized: {
    width: '230px', // Largeur réduite en mode minimisé
    height: '90px', // Hauteur réduite en mode minimisé
    overflow: 'hidden', // Cache le contenu débordant
  },
  header: {
    fontWeight: 'bold', // Texte en gras
    textAlign: 'center', // Alignement centré du texte
    marginBottom: '10px', // Marge inférieure
    color: '#000', // Couleur du texte blanche
    backgroundColor: '#f2b950', // Couleur de fond 
    padding: '10px', // Padding intérieur
    borderRadius: '8px 8px 0 0', // Bords arrondis en haut
    display: 'flex', // Utilisation de flexbox pour l'alignement des enfants
    justifyContent: 'space-between', // Répartition des enfants avec de l'espace entre eux
    alignItems: 'center', // Alignement vertical au centre
  },
  minimizeButton: {
    backgroundColor: 'transparent', // Fond transparent
    border: 'none', // Pas de bordure
    color: 'white', // Couleur du texte blanche
    cursor: 'pointer', // Curseur de pointeur
    fontSize: '20px', // Taille de la police
    lineHeight: '20px', // Hauteur de ligne
  },
  messages: {
    flex: 1, // Prend tout l'espace disponible
    overflowY: 'auto', // Défilement vertical si nécessaire
    display: 'flex', // Utilisation de flexbox pour l'alignement des enfants
    flexDirection: 'column', // Alignement vertical des enfants
  },
  inputContainer: {
    display: 'flex', // Utilisation de flexbox pour l'alignement des enfants
    marginTop: 'auto', // Marge supérieure automatique pour pousser vers le bas
  },
  input: {
    flex: 1, // Prend tout l'espace disponible
    padding: '5px', // Padding intérieur
    border: '1px solid #ccc', // Bordure grise
    borderRadius: '4px 0 0 4px', // Bords arrondis à gauche
    fontSize: '16px', // Taille de la police
  },
  button: {
    padding: '10px 20px', 
    border: 'none',
    backgroundColor: '#000',
    color: 'white',
    borderRadius: '0 4px 4px 0',
    cursor: 'pointer',
    fontSize: '20px',
  },
  buttonHover: {
    backgroundColor: '#E65B53',
  },
  userBubble: {
    backgroundColor: '#fcb900', // Couleur de fond jaune
    borderRadius: '10px', // Bords arrondis
    padding: '2px 5px', // Padding intérieur
    margin: '2px 0', // Marge verticale
    alignSelf: 'flex-end', // Alignement à droite
    maxWidth: '80%', // Largeur maximale de 80%
    textAlign: 'right', // Alignement du texte à droite
    color: '#2D2D2D', // Couleur du texte bleue
  },
  botBubble: {
    backgroundColor: '#ffffff', // Couleur de fond blanche
    borderRadius: '10px', // Bords arrondis
    padding: '2px 5px', // Padding intérieur
    margin: '2px 0', // Marge verticale
    alignSelf: 'flex-start', // Alignement à gauche
    maxWidth: '80%', // Largeur maximale de 80%
    color: '#000000', // Couleur du texte noire
  },
  resizeHandle: {
    position: 'absolute', // Positionnement absolu
    top: '0', // En haut du conteneur
    left: '0', // À gauche du conteneur
    width: '10px', // Largeur de la poignée
    height: '10px', // Hauteur de la poignée
    backgroundColor: '#FFFFFF', // Couleur de fond blanche
    cursor: 'nwse-resize', // Curseur de redimensionnement
    zIndex: 1001, // Niveau de profondeur supérieur
    borderTopLeftRadius: '8px', // Bord supérieur gauche arrondi
  }
};

// Exportation du composant ChatBotSimpleApi comme composant par défaut
export default ChatBotSimpleApi;
