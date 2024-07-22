// @ts-nocheck
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://rbqzjfxvniviaupdmrpy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicXpqZnh2bml2aWF1cGRtcnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEzMTY5NzAsImV4cCI6MjAzNjg5Mjk3MH0.SNuKv6F5XU8FK6oDuD5S5rJF25fh7Cjh91TVcjpYc6o';
const supabase = createClient(supabaseUrl, supabaseKey);



document.addEventListener('DOMContentLoaded', function() {
    setupFormHandlers();
    displayCourses();
    displayProductsForCourse();
});

async function displayCourses() {
  try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
          console.log('Utilisateur non connecté.');
          return;
      }

      const userId = session.user.id;

      const { data: courses, error } = await supabase
          .from('courses')
          .select('id, date')
          .eq('user_id', userId)
          .order('date', { ascending: true });

      if (error) throw error;

      const coursesSection = document.querySelector('#courses-section');
      coursesSection.innerHTML = '<h2>Mes courses</h2>';
      if (courses.length === 0) {
          coursesSection.innerHTML += '<p>Aucune course ajoutée.</p>';
      } else {
          for (const course of courses) {
              const courseElement = document.createElement('div');
              courseElement.classList.add('course');
              courseElement.innerHTML = `
                  <p>Course du: ${new Date(course.date).toLocaleDateString('fr-FR')}</p>
                  <button class="details-button" data-course-id="${course.id}">Détails</button>
              `;
              coursesSection.appendChild(courseElement);
          }

          const detailButtons = document.querySelectorAll('.details-button');
          detailButtons.forEach(button => {
              button.addEventListener('click', function() {
                  const courseId = button.getAttribute('data-course-id');
                  localStorage.setItem('currentCourseId', courseId); // Enregistrer dans localStorage
                  window.location.href = `details.html`;
              });
          });
      }
  } catch (error) {
      console.error('Erreur lors de la récupération des courses:', error.message);
  }
}


// Fonction qui gère l'affichage des produits
async function displayProductsForCourse() {

  // Écouteur d'évenement pour la suppression
  function addDeleteButtonEventListeners() {
    const deleteButtons = document.querySelectorAll('.supprimer');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const productId = button.getAttribute('data-product-id');
            if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
                await deleteProduct(productId);
                await displayProductsForCourse();
            }
        });
    });
  }

  // Écouteur d'évenement pour la modification
  function addEditButtonEventListeners() {
    const editButtons = document.querySelectorAll('.modifier');
    editButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const productId = button.getAttribute('data-product-id');
            await populateEditForm(productId);
            const editModal = new bootstrap.Modal(document.getElementById('editProductModal'));
            editModal.show();
        });
    });
  }

  // Écouteur d"='évenement pour le status acheter/pas acheter
  function addStatusButtonEventListeners() {
    const buyButtons = document.querySelectorAll('.acheter');
    const notBuyButtons = document.querySelectorAll('.pas-acheter');

    buyButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const productId = button.getAttribute('data-product-id');
            await updateProductStatus(productId, true);
        });
    });

    notBuyButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const productId = button.getAttribute('data-product-id');
            await updateProductStatus(productId, false);
        });
    });
}


    const courseId = localStorage.getItem('currentCourseId');
    if (!courseId) {
        console.error('Course ID non trouvé dans localStorage.');
        return;
    }

    try {
        const { data: products, error } = await supabase
            .from('produits')
            .select('*')
            .eq('course_id', courseId);

        if (error) throw error;

        const productsSection = document.querySelector('#products-section');
        productsSection.innerHTML = '<h2>Produits pour cette course</h2>';
        if (products.length === 0) {
            productsSection.innerHTML += '<p>Aucun produit pour cette course.</p>';
        } else {
            products.forEach(product => {
                const productElement = document.createElement('div');
                productElement.classList.add('product');
                if (product.status_achat) {
                  productElement.classList.add('green-border');
                } else {
                    productElement.classList.add('yellow-border');
                }
                productElement.innerHTML = `
                    <div>
                      <p>Produit: ${product.nom_produit}</p>
                      <p>Prix: ${product.prix} XOF</p>
                      <p>Quantité: ${product.quantite}</p>
                      <p>Status: ${product.status_achat ? 'Acheté' : 'Pas acheté'}</p>
                    </div>
                    <div class="actions">
                      <button class="acheter" data-product-id="${product.id}" ${product.status_achat ? 'style="display:none;"' : ''}>Acheter</button>
                      <button class="pas-acheter" data-product-id="${product.id}" ${!product.status_achat ? 'style="display:none;"' : ''}>Pas acheter</button>
                      <div>
                        <button class="modifier" data-product-id="${product.id}"><img src="img/edit.svg" /></button>
                        <button class="supprimer" data-product-id="${product.id}"><img src="img/trash.svg"/></button>                      
                      </div>
                    </div>
                `;
                productsSection.appendChild(productElement);
                addDeleteButtonEventListeners();
                addEditButtonEventListeners();
                addStatusButtonEventListeners();
            });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error.message);
    }
}

// Fonction pour supprimer un produit depuis supabase 
async function deleteProduct(productId) {
  try {
      const { error } = await supabase
          .from('produits')
          .delete()
          .eq('id', productId);

      if (error) {
          throw error;
      }

      alert('Produit supprimé avec succès.');
  } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error.message);
      alert('Une erreur est survenue. Veuillez réessayer.');
  }
}

// Fonction pour pré-remplir le formulaire de modification
async function populateEditForm(productId) {
  try {
      const { data: product, error } = await supabase
          .from('produits')
          .select('*')
          .eq('id', productId)
          .single();

      if (error) {
          throw error;
      }

      document.getElementById('editProductName').value = product.nom_produit;
      document.getElementById('editProductPrice').value = product.prix;
      document.getElementById('editProductQuantity').value = product.quantite;
      document.getElementById('editProductForm').setAttribute('data-product-id', productId);
  } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error.message);
      alert('Une erreur est survenue. Veuillez réessayer.');
  }
}

// Écouteur d'évenement pour la soumission du formulaire de modification
document.getElementById('editProductForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const productId = event.target.getAttribute('data-product-id');
  const productName = document.getElementById('editProductName').value;
  const productPrice = document.getElementById('editProductPrice').value;
  const productQuantity = document.getElementById('editProductQuantity').value;

  try {
      const { error } = await supabase
          .from('produits')
          .update({
              nom_produit: productName,
              prix: productPrice,
              quantite: productQuantity
          })
          .eq('id', productId);

      if (error) {
          throw error;
      }

      alert('Produit modifié avec succès.');
      const editModal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
      editModal.hide();
      await displayProductsForCourse();
  } catch (error) {
      console.error('Erreur lors de la modification du produit:', error.message);
      alert('Une erreur est survenue. Veuillez réessayer.');
  }
});

function addStatusButtonEventListeners() {
  const buyButtons = document.querySelectorAll('.acheter');
  const notBuyButtons = document.querySelectorAll('.pas-acheter');

  buyButtons.forEach(button => {
      button.addEventListener('click', async function() {
          const productId = button.getAttribute('data-product-id');
          await updateProductStatus(productId, true);
      });
  });

  notBuyButtons.forEach(button => {
      button.addEventListener('click', async function() {
          const productId = button.getAttribute('data-product-id');
          await updateProductStatus(productId, false);
      });
  });
}

// Fonction pour mettre à jour le status
async function updateProductStatus(productId, status) {
  try {
      const { error } = await supabase
          .from('produits')
          .update({ status_achat: status })
          .eq('id', productId);

      if (error) {
          throw error;
      }

      alert('Statut du produit mis à jour avec succès.');
      await displayProductsForCourse();
  } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du produit:', error.message);
      alert('Une erreur est survenue. Veuillez réessayer.');
  }
}

function setupFormHandlers() {
    setupMenuHandlers();
    setupLogoutHandler();
    setupAddCourseFormHandler();
    setupAddProductFormHandler();
    setupAuthHandlers();
}

// Fonction qui gère le menu burger
function setupMenuHandlers() {
    const menuButton = document.querySelector('.menu-button img');
    const closeButton = document.querySelector('.close-button');
    const sidebar = document.getElementById('sidebar');

    if (menuButton && closeButton && sidebar) {
        menuButton.addEventListener('click', function() {
            sidebar.classList.add('open');
            menuButton.style.display = 'none';
        });

        closeButton.addEventListener('click', function() {
            sidebar.classList.remove('open');
            menuButton.style.display = 'block';
        });
    }
}

// Fonction qui gère la deconnexion du user
function setupLogoutHandler() {
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', async function() {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.log('Error during logout:', error.message);
            } else {
                window.location.href = 'authen.html';
            }
        });
    }
}

function setupAddCourseFormHandler() {
    const addCourseForm = document.getElementById('addCourseForm');
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const courseDate = new Date(document.getElementById('courseDate').value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (courseDate < today) {
                alert('La date de la course ne peut pas être antérieure à la date actuelle.');
                return;
            }

            if (!courseDate) {
                alert('Veuillez sélectionner une date.');
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Vous devez être connecté pour ajouter une course.');
                return;
            }

            const { data, error } = await supabase
                .from('courses')
                .insert([
                    {
                        date: courseDate.toISOString(),
                        user_id: session.user.id
                    }
                ]);

            if (error) {
                console.error('Erreur lors de l\'insertion:', error);
                alert('Une erreur est survenue. Veuillez réessayer.');
            } else {
                alert('Date ajoutée avec succès!');
                addCourseForm.reset();
                var modalElement = document.getElementById('addCourseModal');
                if (modalElement) {
                    var modal = bootstrap.Modal.getInstance(modalElement);
                    modal.hide();
                }
                displayCourses();
            }
        });
    }
}


// Fonction pour enregistrer un produit
function setupAddProductFormHandler() {
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const productName = document.getElementById('productName').value;
            const productPrice = document.getElementById('productPrice').value;
            const productQuantity = document.getElementById('productQuantity').value;
            const courseId = localStorage.getItem('currentCourseId');

            if (!courseId) {
                alert('Course ID non trouvé.');
                return;
            }

            const { data, error } = await supabase
                .from('produits')
                .insert([
                    {
                        nom_produit: productName,
                        prix: productPrice,
                        quantite: productQuantity,
                        course_id: courseId
                    }
                ]);

            if (error) {
                console.error('Erreur lors de l\'ajout du produit:', error);
                alert('Une erreur est survenue. Veuillez réessayer.');
            } else {
                alert('Produit ajouté avec succès!');
                addProductForm.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
                modal.hide();
                await displayProductsForCourse(courseId);
            }
        });
    }
}

function setupAuthHandlers() {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const switchToLoginBtn = document.getElementById('switch-to-login');
    const switchToSignupBtn = document.getElementById('switch-to-signup');

    if (signupForm && loginForm && switchToLoginBtn && switchToSignupBtn) {
        if (localStorage.getItem('lastForm') === 'login') {
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
        } else {
            signupForm.style.display = 'block';
            loginForm.style.display = 'none';
        }

        switchToLoginBtn.addEventListener('click', () => {
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
            localStorage.setItem('lastForm', 'login');
        });

        switchToSignupBtn.addEventListener('click', () => {
            signupForm.style.display = 'block';
            loginForm.style.display = 'none';
            localStorage.setItem('lastForm', 'signup');
        });

        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                console.log('Signup error:', error.message);
            } else {
                alert('Inscription réussie! Veuillez vérifier votre email pour confirmer votre inscription.');
                signupForm.reset();
            }
        });

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                console.log('Login error:', error.message);
            } else {
                alert('Connexion réussie!');
                loginForm.reset();
                window.location.href = 'index.html';
            }
        });
    }
}
