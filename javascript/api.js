// URL de l'API
const apiUrl = 'http://localhost:8000/api/v1/titles/';
const genresApiUrl = 'http://localhost:8000/api/v1/genres/';

// Variables globales pour stocker les films
let allMovies = [];
let categoryMovies = {};

// Fonction pour récupérer tous les films depuis l'API
function getAllMovies() {
  // Vérifier si les films sont déjà en cache
  const cachedMovies = localStorage.getItem('allMovies');
  if (cachedMovies) {
    allMovies = JSON.parse(cachedMovies);
    console.log('Films récupérés depuis le cache :', allMovies.length);
    preloadImages(allMovies); // Précharger les images
    return Promise.resolve(allMovies);
  }

  allMovies = []; // Réinitialiser
  let nextUrl = 'http://localhost:8000/api/v1/titles/?page_size=50&sort_by=-votes,-imdb_score';

  // Fonction récursive pour récupérer toutes les pages
  function fetchMovies(url) {
    if (!url) {
      console.log('Fin de la pagination, total films récupérés :', allMovies.length);
      return Promise.resolve(allMovies); // Fin de la pagination
    }

    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Problème avec l\'API des films');
        }
        return response.json();
      })
      .then(data => {
        allMovies = allMovies.concat(data.results);
        console.log(`Page récupérée, total films : ${allMovies.length}`);
        // Si une page suivante existe, continuer
        return fetchMovies(data.next);
      });
  }

  return fetchMovies(nextUrl)
    .then(() => {
      // Stocker les films dans localStorage
      localStorage.setItem('allMovies', JSON.stringify(allMovies));
      console.log('Films stockés dans le cache :', allMovies.length);
      preloadImages(allMovies); // Précharger les images
      return allMovies;
    })
    .catch(error => {
      logError(`Erreur lors de la récupération des films : ${error.message}`);
      return [];
    });
}

// Fonction pour récupérer les films d'une catégorie
function getMoviesByCategory(category) {
  return fetch(apiUrl + '?genre=' + category + '&page_size=50')
    .then(response => {
      if (!response.ok) {
        throw new Error('Problème avec l\'API');
      }
      return response.json();
    })
    .then(data => {
      categoryMovies[category] = data.results; // Stocker les films par catégorie
      preloadImages(data.results); // Précharger les images
      return data.results;
    })
    .catch(error => {
      logError(`Erreur lors de la récupération des films de la catégorie ${category} : ${error.message}`);
      return [];
    });
}

// Fonction pour récupérer les détails complets d'un film
function getMovieDetails(movieId) {
  console.log(`Récupération des détails pour le film ID: ${movieId}`);
  return fetch(`${apiUrl}${movieId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: Problème avec l'API pour les détails du film`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`Détails complets pour le film ${movieId} :`, data);
      return data;
    })
    .catch(error => {
      logError(`Erreur lors de la récupération des détails du film ${movieId} : ${error.message}`);
      return null;
    });
}

// Fonction pour récupérer toutes les catégories dynamiquement via l'API
function getCategories() {
  let allCategories = [];
  let nextUrl = genresApiUrl;

  // Fonction récursive pour gérer la pagination
  function fetchCategories(url) {
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Problème avec l\'API des genres');
        }
        return response.json();
      })
      .then(data => {
        // Ajouter les genres de la page actuelle
        allCategories = allCategories.concat(data.results.map(genre => genre.name));
        // Si une page suivante existe, continuer à récupérer
        if (data.next) {
          return fetchCategories(data.next);
        }
        return allCategories;
      });
  }

  return fetchCategories(nextUrl)
    .then(categories => {
      console.log('Catégories récupérées dynamiquement :', categories);
      return categories;
    })
    .catch(error => {
      logError(`Erreur lors de la récupération des catégories : ${error.message}`);
      return [];
    });
}

// Exporter les variables et fonctions pour les utiliser dans d'autres fichiers
const api = {
  allMovies,
  categoryMovies,
  getAllMovies,
  getMoviesByCategory,
  getMovieDetails,
  getCategories
};