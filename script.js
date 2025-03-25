// Quand la page est chargée, exécute ce code
document.addEventListener('DOMContentLoaded', function () {
  // URL de l'API
  const apiUrl = 'http://localhost:8000/api/v1/titles/';

  // Variables globales pour stocker les films
  let allMovies = [];
  let categoryMovies = {};

  // Liste statique des catégories
  const staticCategories = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Musical', 'Mystery',
    'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'
  ];

  // Cache pour les URLs d'images valides
  const imageUrlCache = JSON.parse(localStorage.getItem('imageUrlCache')) || {};

  // Fonction pour vérifier si une URL d'image est valide avec réessai
  function checkImageUrl(url, retries = 2, delay = 500) {
    return new Promise((resolve) => {
      if (!url) {
        resolve(false);
        return;
      }

      // Vérifier si l'URL est déjà dans le cache
      if (imageUrlCache[url] !== undefined) {
        resolve(imageUrlCache[url]);
        return;
      }

      const attempt = () => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          imageUrlCache[url] = true;
          localStorage.setItem('imageUrlCache', JSON.stringify(imageUrlCache));
          resolve(true);
        };
        img.onerror = () => {
          if (retries > 0) {
            console.log(`Échec du chargement de l'image, réessai (${retries} restants) :`, url);
            setTimeout(() => {
              checkImageUrl(url, retries - 1, delay).then(resolve);
            }, delay);
          } else {
            imageUrlCache[url] = false;
            localStorage.setItem('imageUrlCache', JSON.stringify(imageUrlCache));
            resolve(false);
          }
        };
      };

      attempt();
    });
  }

  // Fonction pour récupérer tous les films depuis l'API
  function getAllMovies() {
    // Vérifier si les films sont déjà en cache
    const cachedMovies = localStorage.getItem('allMovies');
    if (cachedMovies) {
      allMovies = JSON.parse(cachedMovies);
      console.log('Films récupérés depuis le cache :', allMovies.length);
      return Promise.resolve(allMovies);
    }

    allMovies = []; // Réinitialiser
    let baseUrl = 'http://localhost:8000/api/v1/titles/?page_size=50&sort_by=-votes,-imdb_score';
    let maxPages = 5; // Limiter à 5 pages

    // Générer les URLs pour les 5 premières pages
    let pageUrls = [];
    for (let i = 1; i <= maxPages; i++) {
      pageUrls.push(`${baseUrl}&page=${i}`);
    }

    // Lancer toutes les requêtes en parallèle
    return Promise.all(pageUrls.map(url => 
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error('Problème avec l\'API des films');
          }
          return response.json();
        })
        .then(data => {
          allMovies = allMovies.concat(data.results);
          return allMovies;
        })
    ))
    .then(() => {
      // Stocker les films dans localStorage
      localStorage.setItem('allMovies', JSON.stringify(allMovies));
      console.log('Films stockés dans le cache :', allMovies.length);
      return allMovies;
    })
    .catch(error => {
      console.log('Erreur :', error);
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
        return data.results;
      })
      .catch(error => {
        console.log('Erreur :', error);
        return [];
      });
  }

  // Fonction pour récupérer toutes les catégories
  function getCategories() {
    return Promise.resolve(staticCategories);
  }

  // Fonction pour remplir le menu déroulant avec les catégories
  function fillCategorySelect() {
    getCategories()
      .then(categories => {
        const select = document.querySelector('.autres select');
        if (!select) {
          console.log('Élément select non trouvé pour les catégories.');
          return;
        }
        select.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Choisir une catégorie';
        defaultOption.value = '';
        select.appendChild(defaultOption);

        for (let i = 0; i < categories.length; i++) {
          const option = document.createElement('option');
          option.textContent = categories[i];
          option.value = categories[i];
          select.appendChild(option);
        }
      })
      .catch(error => {
        console.log('Erreur lors du remplissage des catégories :', error);
        const select = document.querySelector('.autres select');
        if (select) {
          select.innerHTML = '<option value="">Erreur lors du chargement des catégories</option>';
        }
      });
  }

  // Fonction pour afficher le meilleur film
  function showBestMovie() {
    const container = document.querySelector('.meilleur-film');
    if (!container) {
      console.log('Section meilleur-film non trouvée.');
      return;
    }
    container.innerHTML = '<p>Chargement en cours...</p>';

    getAllMovies().then(movies => {
      if (!Array.isArray(movies) || movies.length === 0) {
        console.log('Aucun film trouvé ou données invalides.');
        container.innerHTML = `
          <h2>Meilleur film</h2>
          <div class="card">
            <h5 class="card-title">Aucun film disponible</h5>
            <p class="card-text"></p>
            <img class="card-img">
            <button class="btn btn-danger details-btn">Détails</button>
          </div>
        `;
        return;
      }

      const bestMovie = movies[0];
      console.log('Meilleur film trouvé :', bestMovie.title, 'Image URL :', bestMovie.image_url, 'Votes :', bestMovie.votes, 'Score IMDB :', bestMovie.imdb_score);

      // Vérifier l'URL de l'image
      checkImageUrl(bestMovie.image_url).then(isValid => {
        if (isValid) {
          container.innerHTML = `
            <h2>Meilleur film</h2>
            <div class="card">
              <h5 class="card-title">${bestMovie.title}</h5>
              <p class="card-text">${bestMovie.long_description || 'Pas de description'}</p>
              <img class="card-img" src="${bestMovie.image_url}" alt="${bestMovie.title}">
              <button class="btn btn-danger details-btn" data-movie-id="${bestMovie.id}">Détails</button>
            </div>
          `;
        } else {
          console.log('Image invalide pour le meilleur film, utilisation de l\'image alternative :', bestMovie.image_url);
          container.innerHTML = `
            <h2>Meilleur film</h2>
            <div class="card">
              <h5 class="card-title">${bestMovie.title}</h5>
              <p class="card-text">${bestMovie.long_description || 'Pas de description'}</p>
              <img class="card-img" src="logo/alternative.png" alt="${bestMovie.title} (image alternative)">
              <button class="btn btn-danger details-btn" data-movie-id="${bestMovie.id}">Détails</button>
            </div>
          `;
        }
      });
    });
  }

  // Fonction pour afficher les films les mieux notés
  function showTopRatedMovies() {
    const container = document.querySelector('.films-mieux-notes');
    if (!container) {
      console.log('Section films-mieux-notes non trouvée.');
      return;
    }
    container.innerHTML = '<h2>Films les mieux notés</h2><div class="films-grid row"><p>Chargement en cours...</p></div>';

    getAllMovies().then(movies => {
      if (!Array.isArray(movies) || movies.length === 0) {
        console.log('Aucun film trouvé ou données invalides.');
        container.innerHTML = '<h2>Films les mieux notés</h2><div class="films-grid row"><p>Aucun film disponible</p></div>';
        return;
      }

      console.log('Nombre de films récupérés :', movies.length);
      const topMovies = movies.slice(1, 7);
      const grid = document.createElement('div');
      grid.className = 'films-grid row';

      // Vérifier les URLs des images
      const imagePromises = topMovies.map(movie => {
        return checkImageUrl(movie.image_url).then(isValid => {
          return { movie, isValid };
        });
      });

      Promise.all(imagePromises).then(results => {
        setTimeout(() => {
          for (let i = 0; i < results.length; i++) {
            const { movie, isValid } = results[i];
            console.log('Film mieux noté :', movie.title, 'Votes :', movie.votes, 'Score IMDB :', movie.imdb_score);

            const col = document.createElement('div');
            col.className = 'col';

            const card = document.createElement('div');
            card.className = 'card h-100 shadow';

            const img = document.createElement('img');
            img.className = 'card-img-top';
            img.alt = movie.title;
            if (isValid) {
              img.src = movie.image_url;
            } else {
              console.log('Image invalide pour le film, utilisation de l\'image alternative :', movie.title, movie.image_url);
              img.src = 'logo/alternative.png';
              img.alt = `${movie.title} (image alternative)`;
            }

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            const title = document.createElement('h6');
            title.className = 'card-title';
            title.textContent = movie.title;

            const button = document.createElement('button');
            button.className = 'btn btn-danger btn-sm details-btn';
            button.dataset.movieId = movie.id;
            button.textContent = 'Détails';

            cardBody.appendChild(title);
            cardBody.appendChild(button);
            card.appendChild(img);
            card.appendChild(cardBody);
            col.appendChild(card);
            grid.appendChild(col);
          }

          container.innerHTML = '<h2>Films les mieux notés</h2>';
          container.appendChild(grid);
        }, 100);
      });
    });
  }

  // Fonction pour afficher les films d'une catégorie
  function showMoviesByCategory(category, section) {
    if (!section) {
      console.log('Section non trouvée pour la catégorie :', category);
      return;
    }
    const grid = section.querySelector('.row');
    if (!grid) {
      console.log('Grille (.row) non trouvée dans la section pour :', category);
      return;
    }

    grid.innerHTML = '<p>Chargement en cours...</p>';

    getMoviesByCategory(category).then(movies => {
      if (!Array.isArray(movies) || movies.length === 0) {
        console.log('Aucun film trouvé pour la catégorie :', category);
        grid.innerHTML = '<p>Aucun film disponible</p>';
        return;
      }

      const moviesToShow = movies.slice(0, 6);

      // Vérifier les URLs des images
      const imagePromises = moviesToShow.map(movie => {
        return checkImageUrl(movie.image_url).then(isValid => {
          return { movie, isValid };
        });
      });

      Promise.all(imagePromises).then(results => {
        setTimeout(() => {
          grid.innerHTML = ''; // Vider la grille

          for (let i = 0; i < results.length; i++) {
            const { movie, isValid } = results[i];

            const col = document.createElement('div');
            col.className = 'col';

            const card = document.createElement('div');
            card.className = 'card h-100 shadow';

            const img = document.createElement('img');
            img.className = 'card-img-top';
            img.alt = movie.title;
            if (isValid) {
              img.src = movie.image_url;
            } else {
              console.log('Image invalide pour le film, utilisation de l\'image alternative :', movie.title, movie.image_url);
              img.src = 'logo/alternative.png';
              img.alt = `${movie.title} (image alternative)`;
            }

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            const title = document.createElement('h6');
            title.className = 'card-title';
            title.textContent = movie.title;

            const button = document.createElement('button');
            button.className = 'btn btn-danger btn-sm details-btn';
            button.dataset.movieId = movie.id;
            button.textContent = 'Détails';

            cardBody.appendChild(title);
            cardBody.appendChild(button);
            card.appendChild(img);
            card.appendChild(cardBody);
            col.appendChild(card);
            grid.appendChild(col);
          }

          if (moviesToShow.length < 6) {
            const message = document.createElement('p');
            message.textContent = `Seulement ${moviesToShow.length} film(s) disponible(s) pour cette catégorie.`;
            section.appendChild(message);
          }
        }, 100);
      });
    });
  }

  // Fonction pour afficher les détails dans le modal
  function showMovieDetails() {
    const buttons = document.querySelectorAll('.details-btn');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        const movieId = this.dataset.movieId;

        // Chercher le film dans allMovies ou categoryMovies
        let movie = allMovies.find(m => m.id === movieId);
        if (!movie) {
          for (let category in categoryMovies) {
            movie = categoryMovies[category].find(m => m.id === movieId);
            if (movie) break;
          }
        }

        if (movie) {
          // Film trouvé dans les données déjà chargées
          checkImageUrl(movie.image_url).then(isValid => {
            document.getElementById('movieModalLabel').textContent = movie.title;
            document.getElementById('modal-body').innerHTML = `
              <img src="${isValid ? movie.image_url : 'logo/alternative.png'}" class="img-fluid mb-3" alt="${movie.title}${isValid ? '' : ' (image alternative)'}">
              <p><strong>Genres :</strong> ${movie.genres.join(', ')}</p>
              <p><strong>Date de sortie :</strong> ${movie.date_published}</p>
              <p><strong>Classification :</strong> ${movie.rated || 'N/A'}</p>
              <p><strong>Score IMDB :</strong> ${movie.imdb_score}</p>
              <p><strong>Réalisateur :</strong> ${movie.directors.join(', ')}</p>
              <p><strong>Acteurs :</strong> ${movie.actors.join(', ')}</p>
              <p><strong>Durée :</strong> ${movie.duration} min</p>
              <p><strong>Pays :</strong> ${movie.countries.join(', ')}</p>
              <p><strong>Recettes :</strong> ${movie.worldwide_gross_income || 'N/A'}</p>
              <p><strong>Résumé :</strong> ${movie.long_description || 'Pas de résumé'}</p>
            `;
            const modal = new bootstrap.Modal(document.getElementById('movieModal'));
            modal.show();
          });
        } else {
          // Si non trouvé, faire un appel à l'API
          fetch(apiUrl + movieId + '/')
            .then(response => {
              if (!response.ok) {
                throw new Error('Problème avec l\'API');
              }
              return response.json();
            })
            .then(movie => {
              checkImageUrl(movie.image_url).then(isValid => {
                document.getElementById('movieModalLabel').textContent = movie.title;
                document.getElementById('modal-body').innerHTML = `
                  <img src="${isValid ? movie.image_url : 'logo/alternative.png'}" class="img-fluid mb-3" alt="${movie.title}${isValid ? '' : ' (image alternative)'}">
                  <p><strong>Genres :</strong> ${movie.genres.join(', ')}</p>
                  <p><strong>Date de sortie :</strong> ${movie.date_published}</p>
                  <p><strong>Classification :</strong> ${movie.rated || 'N/A'}</p>
                  <p><strong>Score IMDB :</strong> ${movie.imdb_score}</p>
                  <p><strong>Réalisateur :</strong> ${movie.directors.join(', ')}</p>
                  <p><strong>Acteurs :</strong> ${movie.actors.join(', ')}</p>
                  <p><strong>Durée :</strong> ${movie.duration} min</p>
                  <p><strong>Pays :</strong> ${movie.countries.join(', ')}</p>
                  <p><strong>Recettes :</strong> ${movie.worldwide_gross_income || 'N/A'}</p>
                  <p><strong>Résumé :</strong> ${movie.long_description || 'Pas de résumé'}</p>
                `;
                const modal = new bootstrap.Modal(document.getElementById('movieModal'));
                modal.show();
              });
            })
            .catch(error => {
              console.log('Erreur :', error);
              document.getElementById('modal-body').innerHTML = '<p>Erreur lors du chargement.</p>';
              const modal = new bootstrap.Modal(document.getElementById('movieModal'));
              modal.show();
            });
        }
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
  showMoviesByCategory('Mystery', document.querySelector('.categories .category-section:nth-of-type(1) .row')?.parentElement || document.querySelector('.categories .row:nth-of-type(1)')?.parentElement);
  showMoviesByCategory('Action', document.querySelector('.categories .category-section:nth-of-type(2) .row')?.parentElement || document.querySelector('.categories .row:nth-of-type(2)')?.parentElement);
  setupCategorySelect();
  showMovieDetails();
});