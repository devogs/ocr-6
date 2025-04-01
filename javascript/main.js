// Fonction pour remplir le menu déroulant avec les catégories
function fillCategorySelect() {
    api.getCategories()
      .then(categories => {
        const select = document.querySelector('.autres select');
        if (!select) {
          logError('Élément select non trouvé pour les catégories.');
          return;
        }
        select.innerHTML = '';
  
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Choisir une catégorie';
        defaultOption.value = '';
        select.appendChild(defaultOption);
  
        if (categories.length === 0) {
          const errorOption = document.createElement('option');
          errorOption.textContent = 'Aucune catégorie disponible';
          errorOption.value = '';
          select.appendChild(errorOption);
          return;
        }
  
        for (let i = 0; i < categories.length; i++) {
          const option = document.createElement('option');
          option.textContent = categories[i];
          option.value = categories[i];
          select.appendChild(option);
        }
      })
      .catch(error => {
        logError(`Erreur lors du remplissage des catégories : ${error.message}`);
        const select = document.querySelector('.autres select');
        if (select) {
          select.innerHTML = '<option value="">Erreur lors du chargement des catégories</option>';
        }
      });
  }
  
  // Événement pour le menu déroulant "Autres"
  function setupCategorySelect() {
    const select = document.querySelector('.autres select');
    select.addEventListener('change', function () {
      const category = this.value;
      const autresSection = document.querySelector('.autres');
      if (category) {
        showMoviesByCategory(category, autresSection).then(() => {
          showMovieDetails(); // Réattacher les écouteurs après le chargement des films
        });
      } else {
        const grid = autresSection.querySelector('.row');
        grid.innerHTML = '';
      }
    });
  }
  
  // Fonction pour charger toutes les sections et attacher les écouteurs
  function loadAllSections() {
    Promise.all([
      fillCategorySelect(),
      showBestMovie(),
      showTopRatedMovies(),
      showMoviesByCategory('Mystery', document.querySelector('.categories .category-section:nth-of-type(1)')),
      showMoviesByCategory('Action', document.querySelector('.categories .category-section:nth-of-type(2)')),
      setupCategorySelect()
    ]).then(() => {
      console.log('Toutes les sections sont chargées, attachement des écouteurs pour les boutons "Détails"');
      showMovieDetails(); // Attacher les écouteurs après que toutes les sections sont chargées
    }).catch(error => {
      logError(`Erreur lors du chargement des sections : ${error.message}`);
    });
  }
  
  // Lancer le chargement des sections
  loadAllSections();