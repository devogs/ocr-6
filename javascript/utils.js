// Cache pour les URLs d'images valides
const imageUrlCache = JSON.parse(localStorage.getItem('imageUrlCache')) || {};

// Journal personnalisé pour les erreurs
const errorLog = [];

function logError(message) {
  errorLog.push({ timestamp: new Date().toISOString(), message });
  // Pour le débogage, vous pouvez activer ceci temporairement
  // console.error(message);
}

// Fonction pour formater un nombre avec des espaces pour les milliers
function formatNumberWithSpaces(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Fonction pour vérifier si une URL d'image est valide en utilisant fetch HEAD
function checkImageUrl(url, retries = 2, delay = 500) {
  return new Promise((resolve) => {
    if (!url) {
      logError(`URL d'image manquante : ${url}`);
      resolve(false);
      return;
    }

    // Vérifier si l'URL est déjà dans le cache
    if (imageUrlCache[url] !== undefined) {
      resolve(imageUrlCache[url]);
      return;
    }

    const attempt = () => {
      // Utiliser fetch avec la méthode HEAD pour vérifier l'existence de l'image
      fetch(url, { method: 'HEAD', mode: 'no-cors' })
        .then(response => {
          // Avec mode: 'no-cors', la réponse est opaque, mais on peut vérifier si la requête a réussi
          if (response.ok || response.type === 'opaque') {
            // Vérifier le type de contenu pour s'assurer que c'est une image
            const contentType = response.headers.get('content-type') || '';
            if (contentType.startsWith('image/') || response.type === 'opaque') {
              imageUrlCache[url] = true;
              localStorage.setItem('imageUrlCache', JSON.stringify(imageUrlCache));
              resolve(true);
            } else {
              logError(`L'URL ${url} n'est pas une image (Content-Type: ${contentType})`);
              imageUrlCache[url] = false;
              localStorage.setItem('imageUrlCache', JSON.stringify(imageUrlCache));
              resolve(false);
            }
          } else {
            throw new Error(`Statut HTTP ${response.status}`);
          }
        })
        .catch(error => {
          if (retries > 0) {
            logError(`Échec de la vérification de l'image, réessai (${retries} restants) : ${url}, Erreur : ${error.message}`);
            setTimeout(() => {
              attempt();
            }, delay);
          } else {
            logError(`Échec final de la vérification de l'image : ${url}, Erreur : ${error.message}`);
            imageUrlCache[url] = false;
            localStorage.setItem('imageUrlCache', JSON.stringify(imageUrlCache));
            resolve(false);
          }
        });
    };

    attempt();
  });
}

// Fonction pour précharger les images (seulement si l'URL est valide)
function preloadImages(movies) {
  movies.forEach(movie => {
    if (movie.image_url && imageUrlCache[movie.image_url] === true) {
      const img = new Image();
      img.src = movie.image_url;
    }
  });
}