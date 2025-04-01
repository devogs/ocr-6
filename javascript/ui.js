// Fonction pour afficher le meilleur film
function showBestMovie() {
    const container = document.querySelector('.meilleur-film');
    if (!container) {
      logError('Section meilleur-film non trouvée.');
      return Promise.resolve();
    }
    container.innerHTML = '<h2 id="best-movie-title">Meilleur film</h2><div class="best-movie-content"><p>Chargement en cours... <span class="loading-spinner"></span></p></div>';
  
    // Récupérer la première page (triée par votes et imdb_score côté serveur)
    return api.getMovies(1, 1).then(movies => {
      if (!Array.isArray(movies) || movies.length === 0) {
        logError('Aucun film trouvé ou données invalides.');
        container.innerHTML = `
          <h2 id="best-movie-title">Meilleur film</h2>
          <div class="best-movie-content">
            <div class="card">
              <img class="card-img" src="logo/alternative.png" alt="Aucun film disponible">
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
  
      // Si aucune description n'est disponible, faire une requête pour les détails complets
      return api.getMovieDetails(bestMovie.id).then(detailedMovie => {
        if (detailedMovie) {
          description = detailedMovie.long_description || detailedMovie.description || detailedMovie.short_description || 'Description non disponible';
        } else {
          description = 'Erreur lors de la récupération des détails du film.';
        }
  
        // Vérifier l'URL de l'image
        return checkImageUrl(bestMovie.image_url).then(isValid => {
          if (isValid) {
            container.innerHTML = `
              <h2 id="best-movie-title">Meilleur film</h2>
              <div class="best-movie-content">
                <div class="card">
                  <img class="card-img" src="${bestMovie.image_url}" alt="${bestMovie.title}">
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
                  <img class="card-img" src="logo/alternative.png" alt="${bestMovie.title} (image alternative)">
                  <div class="card-body">
                    <h5 class="card-title">${bestMovie.title}</h5>
                    <p class="card-text">${description}</p>
                    <button class="btn btn-danger details-btn" data-movie-id="${bestMovie.id}" aria-label="Voir les détails du film ${bestMovie.title}">Détails</button>
                  </div>
                </div>
              </div>
            `;
          }
        });
      });
    });
  }
  
  // Fonction pour afficher les films les mieux notés
  function showTopRatedMovies() {
    const container = document.querySelector('.films-mieux-notes');
    if (!container) {
      logError('Section films-mieux-notes non trouvée.');
      return Promise.resolve();
    }
    container.innerHTML = '<h2 id="top-rated-title">Films les mieux notés</h2><div class="films-grid row"><p>Chargement en cours... <span class="loading-spinner"></span></p></div>';
  
    // Récupérer les 6 films suivants après le meilleur film (page 1, positions 2 à 7)
    return api.getMovies(1, 7).then(movies => {
      if (!Array.isArray(movies) || movies.length <= 1) {
        logError('Pas assez de films pour les mieux notés.');
        container.innerHTML = '<h2 id="top-rated-title">Films les mieux notés</h2><div class="films-grid row"><p>Aucun film disponible. <button class="btn btn-primary retry-btn">Réessayer</button></p></div>';
        container.querySelector('.retry-btn').addEventListener('click', () => showTopRatedMovies());
        return;
      }
  
      const topMovies = movies.slice(1, 7); // Prendre les 6 films suivants après le meilleur
      console.log('Top 6 films les mieux notés (basé sur votes et IMDB score) :', topMovies.map(m => ({ title: m.title, imdb_score: m.imdb_score, votes: m.votes })));
  
      const grid = document.createElement('div');
      grid.className = 'films-grid row';
  
      // Déterminer combien de films afficher initialement en fonction de la taille de l'écran
      const initialDisplayCount = window.innerWidth <= 480 ? 2 : window.innerWidth <= 1024 ? 4 : 6;
  
      // Vérifier les URLs des images
      const imagePromises = topMovies.map(movie => {
        return checkImageUrl(movie.image_url).then(isValid => {
          return { movie, isValid };
        });
      });
  
      return Promise.all(imagePromises).then(results => {
        const visibleMovies = results.slice(0, initialDisplayCount);
        const hiddenMovies = results.slice(initialDisplayCount);
  
        // Afficher les films visibles
        visibleMovies.forEach(({ movie, isValid }) => {
          console.log('Film mieux noté affiché :', movie.title, 'IMDB Score :', movie.imdb_score, 'Votes :', movie.votes);
  
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
  
        container.innerHTML = '<h2 id="top-rated-title">Films les mieux notés</h2>';
        container.appendChild(grid);
  
        // Ajouter le bouton "Voir plus" si nécessaire
        if (hiddenMovies.length > 0) {
          const seeMoreBtn = document.createElement('button');
          seeMoreBtn.className = 'btn btn-primary see-more-btn';
          seeMoreBtn.textContent = 'Voir plus';
          seeMoreBtn.setAttribute('aria-label', 'Afficher plus de films');
          seeMoreBtn.addEventListener('click', () => {
            hiddenMovies.forEach(({ movie, isValid }) => {
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
            seeMoreBtn.remove();
            showMovieDetails(); // Réattacher les écouteurs
          });
          container.appendChild(seeMoreBtn);
        }
      });
    }).catch(error => {
      logError(`Erreur lors du chargement des films les mieux notés : ${error.message}`);
      container.innerHTML = '<h2 id="top-rated-title">Films les mieux notés</h2><div class="films-grid row"><p>Erreur lors du chargement. <button class="btn btn-primary retry-btn">Réessayer</button></p></div>';
      container.querySelector('.retry-btn').addEventListener('click', () => showTopRatedMovies());
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
  
    // Récupérer les 6 premiers films de la catégorie (triés côté serveur)
    return api.getMoviesByCategory(category, 1, 6).then(movies => {
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
      const imagePromises = moviesToShow.map(movie => {
        return checkImageUrl(movie.image_url).then(isValid => {
          return { movie, isValid };
        });
      });
  
      return Promise.all(imagePromises).then(results => {
        grid.innerHTML = ''; // Vider la grille
        const visibleMovies = results.slice(0, initialDisplayCount);
        const hiddenMovies = results.slice(initialDisplayCount);
  
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
  
        // Ajouter le bouton "Voir plus" si nécessaire
        if (hiddenMovies.length > 0) {
          const seeMoreBtn = document.createElement('button');
          seeMoreBtn.className = 'btn btn-primary see-more-btn';
          seeMoreBtn.textContent = 'Voir plus';
          seeMoreBtn.setAttribute('aria-label', 'Afficher plus de films');
          seeMoreBtn.addEventListener('click', () => {
            hiddenMovies.forEach(({ movie, isValid }) => {
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
            seeMoreBtn.remove();
            showMovieDetails(); // Réattacher les écouteurs
          });
          section.appendChild(seeMoreBtn);
        }
  
        if (moviesToShow.length < 6) {
          const message = document.createElement('p');
          message.textContent = `Seulement ${moviesToShow.length} film(s) disponible(s) pour cette catégorie.`;
          section.appendChild(message);
        }
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
      button.addEventListener('click', function () {
        const movieId = this.dataset.movieId;
        console.log(`Clic sur le bouton "Détails" pour le film ID: ${movieId}`);
  
        if (!movieId) {
          logError('ID du film non défini sur le bouton');
          return;
        }
  
        // Puisqu'il n'y a plus de cache, on fait un appel direct à l'API pour les détails
        api.getMovieDetails(movieId).then(movie => {
          if (!movie) {
            logError('Aucun détail trouvé pour ce film');
            document.getElementById('movieModalLabel').textContent = 'Erreur';
            document.getElementById('modal-body').innerHTML = '<p>Erreur lors du chargement des détails du film.</p>';
            const modalElement = document.getElementById('movieModal');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            return;
          }
  
          checkImageUrl(movie.image_url).then(isValid => {
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
        });
      });
    });
  }