// Fonction pour vérifier l'URL de l'image
function checkImageUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      console.log(`Image loaded successfully: ${url}`);
      resolve(true);
    };
    img.onerror = () => {
      console.log(`Image failed to load: ${url}`);
      resolve(false);
    };
    img.onabort = () => {
      console.log(`Image request aborted for URL: ${url}`);
      resolve(false);
    };
    img.src = url;

    // Timeout pour éviter les attentes infinies (15 secondes)
    setTimeout(() => {
      console.log(`Image loading timed out: ${url}`);
      resolve(false);
    }, 15000);
  });
}

// Fonction pour afficher le meilleur film
function showBestMovie() {
  const container = document.querySelector('.meilleur-film');
  if (!container) {
    logError('Section meilleur-film non trouvée.');
    return Promise.resolve();
  }
  container.innerHTML = '<h2 id="best-movie-title">Meilleur film</h2><div class="best-movie-content"><p>Chargement en cours... <span class="loading-spinner"></span></p></div>';

  console.log('Fetching best movie...');
  // Récupérer la première page (triée par votes et imdb_score côté serveur)
  return api.getMovies(1, 1).then(movies => {
    console.log('Best movie API response:', movies);
    if (!Array.isArray(movies) || movies.length === 0) {
      logError('Aucun film trouvé ou données invalides.');
      container.innerHTML = `
        <h2 id="best-movie-title">Meilleur film</h2>
        <div class="best-movie-content">
          <div class="card">
            <div class="image-container">
              <img class="card-img" src="logo/alternative.png" alt="Aucun film disponible">
            </div>
            <div class="card-body">
              <h5 class="card-title">Aucun film disponible</h5>
              <p class="card-text">Erreur lors du chargement des films.</p>
              <button class="btn btn-danger details-btn">Détails</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const bestMovie = movies[0];
    console.log('Meilleur film (basé sur votes et IMDB score) :', {
      title: bestMovie.title,
      imdb_score: bestMovie.imdb_score,
      votes: bestMovie.votes
    });

    // Vérifier si une description est disponible
    let description = bestMovie.long_description || bestMovie.description || bestMovie.short_description || '';

    console.log('Fetching movie details for ID:', bestMovie.id);
    // Si aucune description n'est disponible, faire une requête pour les détails complets
    return api.getMovieDetails(bestMovie.id).then(detailedMovie => {
      console.log('Movie details response:', detailedMovie);
      if (detailedMovie) {
        description = detailedMovie.long_description || detailedMovie.description || detailedMovie.short_description || 'Description non disponible';
      } else {
        description = 'Erreur lors de la récupération des détails du film.';
      }

      // Vérifier l'URL de l'image
      console.log('Checking image URL for best movie:', bestMovie.image_url);
      return checkImageUrl(bestMovie.image_url).then(isValid => {
        console.log(`Best movie image valid: ${isValid}`);
        if (isValid) {
          container.innerHTML = `
            <h2 id="best-movie-title">Meilleur film</h2>
            <div class="best-movie-content">
              <div class="card">
                <div class="image-container">
                  <img class="card-img" src="${bestMovie.image_url}" alt="${bestMovie.title}">
                </div>
                <div class="card-body">
                  <h5 class="card-title">${bestMovie.title}</h5>
                  <p class="card-text">${description}</p>
                  <button class="btn btn-danger details-btn" data-movie-id="${bestMovie.id}" aria-label="Voir les détails du film ${bestMovie.title}">Détails</button>
                </div>
              </div>
            </div>
          `;
        } else {
          container.innerHTML = `
            <h2 id="best-movie-title">Meilleur film</h2>
            <div class="best-movie-content">
              <div class="card">
                <div class="image-container">
                  <img class="card-img" src="logo/alternative.png" alt="${bestMovie.title} (image alternative)">
                </div>
                <div class="card-body">
                  <h5 class="card-title">${bestMovie.title}</h5>
                  <p class="card-text">${description}</p>
                  <button class="btn btn-danger details-btn" data-movie-id="${bestMovie.id}" aria-label="Voir les détails du film ${bestMovie.title}">Détails</button>
                </div>
              </div>
            </div>
          `;
        }
        // Attacher l'écouteur pour le bouton "Détails"
        showMovieDetails();
      });
    });
  }).catch(error => {
    logError(`Erreur lors du chargement du meilleur film : ${error.message}`);
    container.innerHTML = `
      <h2 id="best-movie-title">Meilleur film</h2>
      <div class="best-movie-content">
        <p>Erreur lors du chargement. <button class="btn btn-primary retry-btn">Réessayer</button></p>
      </div>
    `;
    container.querySelector('.retry-btn').addEventListener('click', () => showBestMovie());
  });
}

// Fonction pour afficher les films les mieux notés
function showTopRatedMovies() {
  const container = document.querySelector('.films-mieux-notes');
  if (!container) {
    logError('Section films-mieux-notes non trouvée.');
    return Promise.resolve();
  }

  // Vérifier si la grille existe déjà (pour éviter de la recréer lors du resize)
  let grid = container.querySelector('.films-grid.row');
  if (!grid) {
    container.innerHTML = '<h2 id="top-rated-title">Films les mieux notés</h2><div class="films-grid row"><p>Chargement en cours... <span class="loading-spinner"></span></p></div>';
    grid = container.querySelector('.films-grid.row');
  } else {
    grid.innerHTML = '<p>Chargement en cours... <span class="loading-spinner"></span></p>';
  }

  console.log('Fetching top-rated movies...');
  // Récupérer les 6 films suivants après le meilleur film (page 1, positions 2 à 7)
  return api.getMovies(1, 7).then(movies => {
    console.log('Top-rated movies API response:', movies);
    if (!Array.isArray(movies) || movies.length <= 1) {
      logError('Pas assez de films pour les mieux notés.');
      grid.innerHTML = '<p>Aucun film disponible. <button class="btn btn-primary retry-btn">Réessayer</button></p>';
      grid.querySelector('.retry-btn').addEventListener('click', () => showTopRatedMovies());
      return;
    }

    const topMovies = movies.slice(1, 7); // Prendre les 6 films suivants après le meilleur
    console.log('Top 6 films les mieux notés (basé sur votes et IMDB score) :', topMovies.map(m => ({ title: m.title, imdb_score: m.imdb_score, votes: m.votes })));

    // Déterminer combien de films afficher initialement
    const initialDisplayCount = window.innerWidth <= 480 ? 2 : window.innerWidth <= 1024 ? 4 : 6;

    // Vérifier les URLs des images
    console.log('Checking image URLs for top-rated movies...');
    const imagePromises = topMovies.map(movie => {
      return checkImageUrl(movie.image_url).then(isValid => {
        return { movie, isValid };
      });
    });

    return Promise.all(imagePromises).then(results => {
      console.log('Image validation results for top-rated movies:', results);
      const visibleMovies = results.slice(0, initialDisplayCount);
      const hiddenMovies = results.slice(initialDisplayCount);

      // Créer un tableau pour stocker les éléments DOM des films cachés
      const hiddenElements = [];

      // Vider la grille uniquement après que toutes les images sont validées
      grid.innerHTML = '';

      // Afficher les films visibles
      visibleMovies.forEach(({ movie, isValid }) => {
        const col = document.createElement('div');
        col.className = 'col';

        const card = document.createElement('div');
        card.className = 'card h-100 shadow';

        const img = document.createElement('img');
        img.className = 'card-img-top';
        img.alt = movie.title;
        img.src = isValid ? movie.image_url : 'logo/alternative.png';
        if (!isValid) {
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
        button.setAttribute('aria-label', `Voir les détails du film ${movie.title}`);

        cardBody.appendChild(title);
        cardBody.appendChild(button);
        card.appendChild(img);
        card.appendChild(cardBody);
        col.appendChild(card);
        grid.appendChild(col);
      });

      // Préparer les éléments cachés
      hiddenMovies.forEach(({ movie, isValid }) => {
        const col = document.createElement('div');
        col.className = 'col hidden-movie';
        col.style.display = 'none'; // Cacher initialement

        const card = document.createElement('div');
        card.className = 'card h-100 shadow';

        const img = document.createElement('img');
        img.className = 'card-img-top';
        img.alt = movie.title;
        img.src = isValid ? movie.image_url : 'logo/alternative.png';
        if (!isValid) {
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
        button.setAttribute('aria-label', `Voir les détails du film ${movie.title}`);

        cardBody.appendChild(title);
        cardBody.appendChild(button);
        card.appendChild(img);
        card.appendChild(cardBody);
        col.appendChild(card);
        grid.appendChild(col);
        hiddenElements.push(col);
      });

      // Ajouter le bouton "Voir plus" si nécessaire (mobile et tablette uniquement)
      const existingSeeMoreBtn = container.querySelector('.see-more-btn');
      const existingSeeLessBtn = container.querySelector('.see-less-btn');
      if (existingSeeMoreBtn) existingSeeMoreBtn.remove();
      if (existingSeeLessBtn) existingSeeLessBtn.remove();

      if (hiddenMovies.length > 0 && window.innerWidth <= 1024) {
        const seeMoreBtn = document.createElement('button');
        seeMoreBtn.className = 'btn btn-primary see-more-btn';
        seeMoreBtn.textContent = 'Voir plus';
        seeMoreBtn.setAttribute('aria-label', 'Afficher plus de films');
        seeMoreBtn.addEventListener('click', () => {
          hiddenElements.forEach(col => {
            col.style.display = 'block';
          });
          seeMoreBtn.remove();

          // Ajouter le bouton "Voir moins"
          const seeLessBtn = document.createElement('button');
          seeLessBtn.className = 'btn btn-danger see-less-btn';
          seeLessBtn.textContent = 'Voir moins';
          seeLessBtn.setAttribute('aria-label', 'Cacher les films supplémentaires');
          seeLessBtn.addEventListener('click', () => {
            hiddenElements.forEach(col => {
              col.style.display = 'none';
            });
            seeLessBtn.remove();
            container.appendChild(seeMoreBtn); // Réafficher "Voir plus"
          });
          container.appendChild(seeLessBtn);

          showMovieDetails(); // Réattacher les écouteurs
        });
        container.appendChild(seeMoreBtn);
      }

      // Attacher les écouteurs pour les boutons "Détails"
      showMovieDetails();
    });
  }).catch(error => {
    logError(`Erreur lors du chargement des films les mieux notés : ${error.message}`);
    grid.innerHTML = '<p>Erreur lors du chargement. <button class="btn btn-primary retry-btn">Réessayer</button></p>';
    grid.querySelector('.retry-btn').addEventListener('click', () => showTopRatedMovies());
  });
}

// Fonction pour afficher les films d'une catégorie
function showMoviesByCategory(category, section) {
  if (!section) {
    logError(`Section non trouvée pour la catégorie : ${category}`);
    return Promise.resolve();
  }
  const grid = section.querySelector('.row');
  if (!grid) {
    logError(`Grille (.row) non trouvée dans la section pour : ${category}`);
    return Promise.resolve();
  }

  grid.innerHTML = '<p>Chargement en cours... <span class="loading-spinner"></span></p>';

  console.log(`Fetching movies for category: ${category}`);
  // Récupérer les 6 premiers films de la catégorie (triés côté serveur)
  return api.getMoviesByCategory(category, 1, 6).then(movies => {
    console.log(`Movies API response for category ${category}:`, movies);
    if (!Array.isArray(movies) || movies.length === 0) {
      logError(`Aucun film trouvé pour la catégorie : ${category}`);
      grid.innerHTML = '<p>Aucun film disponible. <button class="btn btn-primary retry-btn">Réessayer</button></p>';
      grid.querySelector('.retry-btn').addEventListener('click', () => showMoviesByCategory(category, section));
      return;
    }

    console.log(`Films affichés pour la catégorie ${category} (triés par votes et IMDB score) :`, movies.map(m => ({ title: m.title, imdb_score: m.imdb_score, votes: m.votes })));

    const moviesToShow = movies.slice(0, 6);
    const initialDisplayCount = window.innerWidth <= 480 ? 2 : window.innerWidth <= 1024 ? 4 : 6;

    // Vérifier les URLs des images
    console.log(`Checking image URLs for category ${category}...`);
    const imagePromises = moviesToShow.map(movie => {
      return checkImageUrl(movie.image_url).then(isValid => {
        return { movie, isValid };
      });
    });

    return Promise.all(imagePromises).then(results => {
      console.log(`Image validation results for category ${category}:`, results);
      grid.innerHTML = ''; // Vider la grille uniquement après que toutes les images sont validées
      const visibleMovies = results.slice(0, initialDisplayCount);
      const hiddenMovies = results.slice(initialDisplayCount);

      // Créer un tableau pour stocker les éléments DOM des films cachés
      const hiddenElements = [];

      // Afficher les films visibles
      visibleMovies.forEach(({ movie, isValid }) => {
        const col = document.createElement('div');
        col.className = 'col';

        const card = document.createElement('div');
        card.className = 'card h-100 shadow';

        const img = document.createElement('img');
        img.className = 'card-img-top';
        img.alt = movie.title;
        img.src = isValid ? movie.image_url : 'logo/alternative.png';
        if (!isValid) {
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
        button.setAttribute('aria-label', `Voir les détails du film ${movie.title}`);

        cardBody.appendChild(title);
        cardBody.appendChild(button);
        card.appendChild(img);
        card.appendChild(cardBody);
        col.appendChild(card);
        grid.appendChild(col);
      });

      // Préparer les éléments cachés
      hiddenMovies.forEach(({ movie, isValid }) => {
        const col = document.createElement('div');
        col.className = 'col hidden-movie';
        col.style.display = 'none'; // Cacher initialement

        const card = document.createElement('div');
        card.className = 'card h-100 shadow';

        const img = document.createElement('img');
        img.className = 'card-img-top';
        img.alt = movie.title;
        img.src = isValid ? movie.image_url : 'logo/alternative.png';
        if (!isValid) {
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
        button.setAttribute('aria-label', `Voir les détails du film ${movie.title}`);

        cardBody.appendChild(title);
        cardBody.appendChild(button);
        card.appendChild(img);
        card.appendChild(cardBody);
        col.appendChild(card);
        grid.appendChild(col);
        hiddenElements.push(col);
      });

      // Ajouter le bouton "Voir plus" si nécessaire (mobile et tablette uniquement)
      const existingSeeMoreBtn = section.querySelector('.see-more-btn');
      const existingSeeLessBtn = section.querySelector('.see-less-btn');
      if (existingSeeMoreBtn) existingSeeMoreBtn.remove();
      if (existingSeeLessBtn) existingSeeLessBtn.remove();

      if (hiddenMovies.length > 0 && window.innerWidth <= 1024) {
        const seeMoreBtn = document.createElement('button');
        seeMoreBtn.className = 'btn btn-primary see-more-btn';
        seeMoreBtn.textContent = 'Voir plus';
        seeMoreBtn.setAttribute('aria-label', 'Afficher plus de films');
        seeMoreBtn.addEventListener('click', () => {
          hiddenElements.forEach(col => {
            col.style.display = 'block';
          });
          seeMoreBtn.remove();

          // Ajouter le bouton "Voir moins"
          const seeLessBtn = document.createElement('button');
          seeLessBtn.className = 'btn btn-danger see-less-btn';
          seeLessBtn.textContent = 'Voir moins';
          seeLessBtn.setAttribute('aria-label', 'Cacher les films supplémentaires');
          seeLessBtn.addEventListener('click', () => {
            hiddenElements.forEach(col => {
              col.style.display = 'none';
            });
            seeLessBtn.remove();
            section.appendChild(seeMoreBtn); // Réafficher "Voir plus"
          });
          section.appendChild(seeLessBtn);

          showMovieDetails(); // Réattacher les écouteurs
        });
        section.appendChild(seeMoreBtn);
      }

      if (moviesToShow.length < 6) {
        const message = document.createElement('p');
        message.textContent = `Seulement ${moviesToShow.length} film(s) disponible(s) pour cette catégorie.`;
        section.appendChild(message);
      }

      // Attacher les écouteurs pour les boutons "Détails"
      showMovieDetails();
    });
  }).catch(error => {
    logError(`Erreur lors du chargement de la catégorie ${category} : ${error.message}`);
    grid.innerHTML = '<p>Erreur lors du chargement. <button class="btn btn-primary retry-btn">Réessayer</button></p>';
    grid.querySelector('.retry-btn').addEventListener('click', () => showMoviesByCategory(category, section));
  });
}

// Fonction pour afficher les détails dans le modal
function showMovieDetails() {
  console.log('Initialisation des écouteurs pour les boutons "Détails"');
  const buttons = document.querySelectorAll('.details-btn');
  console.log(`Nombre de boutons "Détails" trouvés : ${buttons.length}`);

  buttons.forEach(button => {
    // Supprimer les anciens écouteurs pour éviter les doublons
    button.removeEventListener('click', handleDetailsClick);
    button.addEventListener('click', handleDetailsClick);
  });
}

function handleDetailsClick() {
  const movieId = this.dataset.movieId;
  console.log(`Clic sur le bouton "Détails" pour le film ID: ${movieId}`);

  if (!movieId) {
    logError('ID du film non défini sur le bouton');
    return;
  }

  console.log(`Fetching movie details for ID: ${movieId}`);
  // Puisqu'il n'y a plus de cache, on fait un appel direct à l'API pour les détails
  api.getMovieDetails(movieId).then(movie => {
    console.log('Movie details response for modal:', movie);
    if (!movie) {
      logError('Aucun détail trouvé pour ce film');
      document.getElementById('movieModalLabel').textContent = 'Erreur';
      document.getElementById('modal-body').innerHTML = '<p>Erreur lors du chargement des détails du film.</p>';
      const modalElement = document.getElementById('movieModal');
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
      return;
    }

    console.log('Checking image URL for modal:', movie.image_url);
    checkImageUrl(movie.image_url).then(isValid => {
      console.log(`Modal image valid: ${isValid}`);
      document.getElementById('movieModalLabel').textContent = movie.title;
      document.getElementById('modal-body').innerHTML = `
        <img src="${isValid ? movie.image_url : 'logo/alternative.png'}" class="img-fluid mb-3" alt="${movie.title}${isValid ? '' : ' (image alternative)'}">
        ${movie.genres ? `<p><strong>Genres :</strong> ${movie.genres.join(', ')}</p>` : ''}
        <p><strong>Date de sortie :</strong> ${movie.date_published || 'N/A'}</p>
        <p><strong>Classification :</strong> ${movie.rated || 'N/A'}</p>
        <p><strong>Score IMDB :</strong> ${movie.imdb_score || 'N/A'}</p>
        <p><strong>Réalisateur :</strong> ${movie.directors ? movie.directors.join(', ') : 'N/A'}</p>
        <p><strong>Acteurs :</strong> ${movie.actors ? movie.actors.join(', ') : 'N/A'}</p>
        <p><strong>Durée :</strong> ${movie.duration ? movie.duration + ' min' : 'N/A'}</p>
        <p><strong>Pays d'origine :</strong> ${movie.countries ? movie.countries.join(', ') : 'N/A'}</p>
        <p><strong>Recettes :</strong> ${movie.worldwide_gross_income ? '$' + formatNumberWithSpaces(movie.worldwide_gross_income) : 'N/A'}</p>
        <p><strong>Résumé :</strong> ${movie.long_description || movie.description || 'Pas de résumé'}</p>
      `;
      const modalElement = document.getElementById('movieModal');
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    });
  }).catch(error => {
    logError(`Erreur lors du chargement des détails du film ${movieId} : ${error.message}`);
    document.getElementById('movieModalLabel').textContent = 'Erreur';
    document.getElementById('modal-body').innerHTML = '<p>Erreur lors du chargement des détails du film.</p>';
    const modalElement = document.getElementById('movieModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  });
}

// Fonction pour débouncer les événements
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Fonction pour initialiser les sections de catégories (appelée une seule fois)
function initializeCategorySections() {
  const categories = ['Mystery', 'Action'];
  const categoriesContainer = document.querySelector('.categories');
  if (categoriesContainer) {
    // S'assurer que le conteneur est vide avant d'ajouter les sections
    categoriesContainer.innerHTML = '';
    categories.forEach(category => {
      const section = document.createElement('div');
      section.className = 'category-section';
      section.dataset.category = category; // Ajouter un identifiant pour la catégorie
      section.innerHTML = `
        <h2>${category}</h2>
        <div class="row"></div>
      `;
      categoriesContainer.appendChild(section);
      console.log(`Section créée pour la catégorie : ${category}`);
      showMoviesByCategory(category, section);
    });
  } else {
    console.warn('Categories container not found.');
  }
}

// Initialiser l'affichage une fois le DOM chargé
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, initializing page...');
  showBestMovie();
  showTopRatedMovies();

  // Initialiser les sections de catégories (une seule fois)
  initializeCategorySections();

  // Charger la section "Autres" sans catégorie par défaut
  const autresSection = document.querySelector('.autres');
  if (autresSection) {
    const grid = autresSection.querySelector('.row');
    if (grid) {
      grid.innerHTML = ''; // S'assurer que la grille est vide au chargement
    } else {
      console.warn('Grid (.row) not found in "Autres" section.');
    }
    const select = autresSection.querySelector('select');
    if (select) {
      select.addEventListener('change', (e) => {
        const selectedCategory = e.target.value;
        console.log(`Category selected in "Autres": ${selectedCategory}`);
        if (selectedCategory) {
          showMoviesByCategory(selectedCategory, autresSection);
        } else {
          // Si aucune catégorie n'est sélectionnée, vider la grille
          if (grid) {
            grid.innerHTML = '';
          }
        }
      });
    } else {
      console.warn('Select element not found in "Autres" section.');
    }
  } else {
    console.warn('"Autres" section not found.');
  }
});

// Mettre à jour l'affichage lors du redimensionnement de la fenêtre (avec débounce)
const debouncedResize = debounce(() => {
  console.log('Événement resize déclenché');
  showTopRatedMovies();

  // Mettre à jour les catégories existantes sans en créer de nouvelles
  const categories = ['Mystery', 'Action'];
  const categoriesContainer = document.querySelector('.categories');
  if (categoriesContainer) {
    const existingSections = categoriesContainer.querySelectorAll('.category-section');
    console.log(`Nombre de sections existantes : ${existingSections.length}`);
    categories.forEach(category => {
      const section = categoriesContainer.querySelector(`.category-section[data-category="${category}"]`);
      if (section) {
        console.log(`Mise à jour de la catégorie : ${category}`);
        showMoviesByCategory(category, section);
      } else {
        console.warn(`Section pour la catégorie ${category} non trouvée lors du resize`);
      }
    });
  }

  const autresSection = document.querySelector('.autres');
  if (autresSection) {
    const select = autresSection.querySelector('select');
    const selectedCategory = select ? select.value : null;
    if (selectedCategory) {
      console.log(`Updating "Autres" section with category: ${selectedCategory}`);
      showMoviesByCategory(selectedCategory, autresSection);
    } else {
      const grid = autresSection.querySelector('.row');
      if (grid) {
        grid.innerHTML = ''; // S'assurer que la grille est vide si aucune catégorie n'est sélectionnée
      }
    }
  }
}, 300);

// S'assurer qu'il n'y a qu'un seul écouteur pour l'événement resize
window.removeEventListener('resize', debouncedResize); // Supprimer tout écouteur existant
window.addEventListener('resize', debouncedResize); // Ajouter l'écouteur