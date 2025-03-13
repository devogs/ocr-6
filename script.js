// Quand la page est chargée, exécute ce code
document.addEventListener('DOMContentLoaded', function () {
    // URL de l'API
    const apiUrl = 'http://localhost:8000/api/v1/titles/';
  
    // Fonction pour récupérer tous les films
    function getAllMovies() {
      // On fait une requête à l'API
      return fetch(apiUrl + '?page=1') // On prend la première page
        .then(response => {
          // Vérifie si la réponse est OK
          if (!response.ok) {
            throw new Error('Problème avec l\'API');
          }
          return response.json(); // Convertit la réponse en JSON
        })
        .then(data => {
          return data.results; // Retourne la liste des films
        })
        .catch(error => {
          console.log('Erreur :', error);
          return []; // Retourne une liste vide en cas d'erreur
        });
    }
  
    // Fonction pour afficher le meilleur film
    function showBestMovie() {
      getAllMovies().then(movies => {
        // Trouve le film avec le meilleur score
        let bestMovie = movies[0]; // Prend le premier film par défaut
        for (let i = 0; i < movies.length; i++) {
          if (movies[i].imdb_score > bestMovie.imdb_score) {
            bestMovie = movies[i];
          }
        }
  
        // Met à jour le HTML
        document.querySelector('.meilleur-film .card-title').textContent = bestMovie.title;
        document.querySelector('.meilleur-film .card-text').textContent = bestMovie.description;
        document.querySelector('.meilleur-film .card-img').src = bestMovie.image_url;
        document.querySelector('.meilleur-film .details-btn').dataset.movieId = bestMovie.id;
      });
    }
  
    // Fonction pour afficher les films les mieux notés
    function showTopRatedMovies() {
      getAllMovies().then(movies => {
        // Trie les films par score (du plus grand au plus petit)
        movies.sort((a, b) => b.imdb_score - a.imdb_score);
  
        // Prend les 5 films après le meilleur
        const topMovies = movies.slice(1, 6); // 5 films après le premier
  
        // Récupère la grille
        const grid = document.querySelector('.films-mieux-notes .films-grid');
        grid.innerHTML = ''; // Vide la grille
  
        // Ajoute chaque film
        for (let i = 0; i < topMovies.length; i++) {
          const movie = topMovies[i];
          const movieCard = `
            <div class="col">
              <div class="card h-100 shadow">
                <img src="${movie.image_url}" class="card-img-top" alt="${movie.title}">
                <div class="card-body">
                  <h6 class="card-title">${movie.title}</h6>
                  <button class="btn btn-danger btn-sm details-btn" data-bs-toggle="modal" data-bs-target="#movieModal" data-movie-id="${movie.id}">Détails</button>
                </div>
              </div>
            </div>
          `;
          grid.innerHTML += movieCard;
        }
      });
    }
  
    // Fonction pour afficher les films d'une catégorie
    function showMoviesByCategory(category, section) {
      fetch(apiUrl + '?genre=' + category)
        .then(response => {
          if (!response.ok) {
            throw new Error('Problème avec l\'API');
          }
          return response.json();
        })
        .then(data => {
          const movies = data.results.slice(0, 6); // Prend 6 films max
          const grid = section.querySelector('.row');
          grid.innerHTML = '';
  
          for (let i = 0; i < movies.length; i++) {
            const movie = movies[i];
            const movieCard = `
              <div class="col">
                <div class="card h-100 shadow">
                  <img src="${movie.image_url}" class="card-img-top" alt="${movie.title}">
                  <div class="card-body">
                    <h6 class="card-title">${movie.title}</h6>
                    <button class="btn btn-danger btn-sm details-btn" data-bs-toggle="modal" data-bs-target="#movieModal" data-movie-id="${movie.id}">Détails</button>
                  </div>
                </div>
              </div>
            `;
            grid.innerHTML += movieCard;
          }
        })
        .catch(error => {
          console.log('Erreur :', error);
        });
    }
  
    // Fonction pour afficher les détails dans le modal
    function showMovieDetails() {
      const buttons = document.querySelectorAll('.details-btn');
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function () {
          const movieId = this.dataset.movieId;
          fetch(apiUrl + movieId + '/')
            .then(response => {
              if (!response.ok) {
                throw new Error('Problème avec l\'API');
              }
              return response.json();
            })
            .then(movie => {
              document.getElementById('movieModalLabel').textContent = movie.title;
              document.getElementById('modal-body').innerHTML = `
                <img src="${movie.image_url}" class="img-fluid mb-3" alt="${movie.title}">
                <p><strong>Genres :</strong> ${movie.genres.join(', ')}</p>
                <p><strong>Date de sortie :</strong> ${movie.date_published}</p>
                <p><strong>Classification :</strong> ${movie.rated || 'N/A'}</p>
                <p><strong>Score IMDB :</strong> ${movie.imdb_score}</p>
                <p><strong>Réalisateur :</strong> ${movie.directors.join(', ')}</p>
                <p><strong>Acteurs :</strong> ${movie.actors.join(', ')}</p>
                <p><strong>Durée :</strong> ${movie.duration} min</p>
                <p><strong>Pays :</strong> ${movie.countries.join(', ')}</p>
                <p><strong>Recettes :</strong> ${movie.worldwide_gross_income || 'N/A'}</p>
                <p><strong>Résumé :</strong> ${movie.description}</p>
              `;
            })
            .catch(error => {
              console.log('Erreur :', error);
              document.getElementById('modal-body').innerHTML = '<p>Erreur lors du chargement.</p>';
            });
        });
      }
    }
  
    // Événement pour le menu déroulant "Autres"
    function setupCategorySelect() {
      const select = document.querySelector('.autres select');
      select.addEventListener('change', function () {
        const category = this.value;
        const autresSection = document.querySelector('.autres');
        showMoviesByCategory(category, autresSection);
      });
    }
  
    // Appelle toutes les fonctions pour charger les données
    showBestMovie();
    showTopRatedMovies();
    showMoviesByCategory('Mystery', document.querySelector('.categories section:nth-child(1)'));
    showMoviesByCategory('Action', document.querySelector('.categories section:nth-child(2)'));
    showMoviesByCategory('Comédies', document.querySelector('.autres'));
    setupCategorySelect();
    showMovieDetails();
  });