// URL de l'API
const apiUrl = 'http://localhost:8000/api/v1/titles/';
const genresApiUrl = 'http://localhost:8000/api/v1/genres/';

// Fonction pour récupérer les films depuis l'API avec tri server-side
function getMovies(page = 1, pageSize = 50) {
  // Tri par votes (décroissant) puis par imdb_score (décroissant)
  const url = `${apiUrl}?page=${page}&page_size=${pageSize}&sort_by=-votes,-imdb_score`;
  console.log(`Récupération des films, page ${page}, URL: ${url}`);

  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Problème avec l\'API des films');
      }
      return response.json();
    })
    .then(data => {
      console.log(`Films récupérés (page ${page}) : ${data.results.length}`);
      return data.results;
    })
    .catch(error => {
      logError(`Erreur lors de la récupération des films : ${error.message}`);
      return [];
    });
}

// Fonction pour récupérer les films d'une catégorie avec tri server-side
function getMoviesByCategory(category, page = 1, pageSize = 50) {
  const url = `${apiUrl}?genre=${category}&page=${page}&page_size=${pageSize}&sort_by=-votes,-imdb_score`;
  console.log(`Récupération des films pour la catégorie ${category}, page ${page}, URL: ${url}`);

  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Problème avec l'API pour la catégorie ${category}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`Films récupérés pour la catégorie ${category} (page ${page}) : ${data.results.length}`);
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
    if (!url) {
      console.log('Fin de la pagination des catégories, total catégories récupérées :', allCategories.length);
      return Promise.resolve(allCategories);
    }

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
        console.log(`Page de catégories récupérée, total : ${allCategories.length}`);
        // Si une page suivante existe, continuer à récupérer
        return fetchCategories(data.next);
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

// Exporter les fonctions pour les utiliser dans d'autres fichiers
const api = {
  getMovies,
  getMoviesByCategory,
  getMovieDetails,
  getCategories
};