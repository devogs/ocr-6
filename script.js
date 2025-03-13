// Quand la page est chargée, exécute ce code
document.addEventListener('DOMContentLoaded', function () {
    // URL de l'API
    const apiUrl = 'http://localhost:8000/api/v1/titles/';
  
    // Fonction pour récupérer tous les films depuis l'API
    function getAllMovies() {
      let allMovies = [];
      let url = 'http://localhost:8000/api/v1/titles/';
  
      function fetchPage(pageUrl) {
        return fetch(pageUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error('Problème avec l\'API des films');
            }
            return response.json();
          })
          .then(data => {
            allMovies = allMovies.concat(data.results);
            if (data.next) {
              return fetchPage(data.next);
            }
            return allMovies;
          });
      }
  
      return fetchPage(url).catch(error => {
        console.log('Erreur :', error);
        return [];
      });
    }
  
    // Fonction pour récupérer les films d'une catégorie
    function getMoviesByCategory(category) {
      return fetch(apiUrl + '?genre=' + category)
        .then(response => {
          if (!response.ok) {
            throw new Error('Problème avec l\'API');
          }
          return response.json();
        })
        .then(data => {
          return data.results;
        })
        .catch(error => {
          console.log('Erreur :', error);
          return [];
        });
    }
  
    // Fonction pour récupérer toutes les catégories depuis l'API
    function getCategories() {
      let allCategories = [];
      let url = 'http://localhost:8000/api/v1/genres/';
  
      function fetchPage(pageUrl) {
        return fetch(pageUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error('Problème avec l\'API des catégories');
            }
            return response.json();
          })
          .then(data => {
            allCategories = allCategories.concat(data.results);
            if (data.next) {
              return fetchPage(data.next);
            }
            return allCategories;
          });
      }
  
      return fetchPage(url).catch(error => {
        console.log('Erreur :', error);
        return [];
      });
    }
  
    // Fonction pour remplir le menu déroulant avec les catégories
    function fillCategorySelect() {
      getCategories().then(categories => {
        const select = document.querySelector('.autres select');
        select.innerHTML = '';
  
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Choisir une catégorie';
        defaultOption.value = '';
        select.appendChild(defaultOption);
  
        for (let i = 0; i < categories.length; i++) {
          const option = document.createElement('option');
          option.textContent = categories[i].name;
          option.value = categories[i].name;
          select.appendChild(option);
        }
      });
    }
  
    // Fonction pour afficher le meilleur film
    function showBestMovie() {
      getAllMovies().then(movies => {
        let bestMovie = movies[0];
        for (let i = 0; i < movies.length; i++) {
          if (movies[i].imdb_score > bestMovie.imdb_score) {
            bestMovie = movies[i];
          }
        }
  
        document.querySelector('.meilleur-film .card-title').textContent = bestMovie.title;
        document.querySelector('.meilleur-film .card-text').textContent = bestMovie.description || 'Pas de description';
        document.querySelector('.meilleur-film .card-img').src = bestMovie.image_url || 'https://via.placeholder.com/200x300';
        document.querySelector('.meilleur-film .details-btn').dataset.movieId = bestMovie.id;
      });
    }
  
    // Fonction pour afficher les films les mieux notés
    function showTopRatedMovies() {
      getAllMovies().then(movies => {
        movies.sort((a, b) => b.imdb_score - a.imdb_score);
        const topMovies = movies.slice(1, 7); // 6 films au lieu de 5
        const grid = document.querySelector('.films-mieux-notes .films-grid');
        grid.innerHTML = '';
  
        for (let i = 0; i < topMovies.length; i++) {
          const movie = topMovies[i];
          const movieCard = `
            <div class="col">
              <div class="card h-100 shadow">
                <img src="${movie.image_url || 'https://via.placeholder.com/200x300'}" class="card-img-top" alt="${movie.title}">
                <div class="card-body">
                  <h6 class="card-title">${movie.title}</h6>
                  <button class="btn btn-danger btn-sm details-btn" data-movie-id="${movie.id}">Détails</button>
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
      getMoviesByCategory(category).then(movies => {
        const moviesToShow = movies.slice(0, 6);
        const grid = section.querySelector('.row');
        grid.innerHTML = '';
  
        for (let i = 0; i < moviesToShow.length; i++) {
          const movie = moviesToShow[i];
          const movieCard = `
            <div class="col">
              <div class="card h-100 shadow">
                <img src="${movie.image_url || 'https://via.placeholder.com/200x300'}" class="card-img-top" alt="${movie.title}">
                <div class="card-body">
                  <h6 class="card-title">${movie.title}</h6>
                  <button class="btn btn-danger btn-sm details-btn" data-movie-id="${movie.id}">Détails</button>
                </div>
              </div>
            </div>
          `;
          grid.innerHTML += movieCard;
        }
  
        if (moviesToShow.length < 6) {
          const message = document.createElement('p');
          message.textContent = `Seulement ${moviesToShow.length} film(s) disponible(s) pour cette catégorie.`;
          section.appendChild(message);
        }
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
                <img src="${movie.image_url || 'https://via.placeholder.com/200x300'}" class="img-fluid mb-3" alt="${movie.title}">
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
              const modal = new bootstrap.Modal(document.getElementById('movieModal'));
              modal.show();
            })
            .catch(error => {
              console.log('Erreur :', error);
              document.getElementById('modal-body').innerHTML = '<p>Erreur lors du chargement.</p>';
              const modal = new bootstrap.Modal(document.getElementById('movieModal'));
              modal.show();
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
        if (category) {
          showMoviesByCategory(category, autresSection);
        } else {
          const grid = autresSection.querySelector('.row');
          grid.innerHTML = '';
        }
      });
    }
  
    // Appelle toutes les fonctions pour charger les données
    fillCategorySelect();
    showBestMovie();
    showTopRatedMovies();
    showMoviesByCategory('Mystery', document.querySelector('.categories .category-section:nth-child(1)'));
    showMoviesByCategory('Action', document.querySelector('.categories .category-section:nth-child(2)'));
    setupCategorySelect();
    showMovieDetails();
  });