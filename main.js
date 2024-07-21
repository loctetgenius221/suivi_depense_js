// @ts-nocheck
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://rbqzjfxvniviaupdmrpy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicXpqZnh2bml2aWF1cGRtcnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEzMTY5NzAsImV4cCI6MjAzNjg5Mjk3MH0.SNuKv6F5XU8FK6oDuD5S5rJF25fh7Cjh91TVcjpYc6o';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', function() {
    setupFormHandlers();
    displayCourses();
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
                button.addEventListener('click', async function() {
                    const courseId = button.getAttribute('data-course-id');
                    await displayProductsForCourse(courseId);
                });
            });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des courses:', error.message);
    }
}

async function displayProductsForCourse(courseId) {
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
                productElement.innerHTML = `
                    <p>Produit: ${product.nom}</p>
                    <p>Quantité: ${product.quantite}</p>
                `;
                productsSection.appendChild(productElement);
            });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error.message);
    }
}

function setupFormHandlers() {
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
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            localStorage.setItem('lastForm', 'signup');
        });

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('nomComplet').value;
            const email = document.getElementById('emailSignup').value;
            const password = document.getElementById('mot_de_passeSignup').value;
            const confirmPassword = document.getElementById('mot_de_passeConfirmSignup').value;

            if (password !== confirmPassword) {
                document.getElementById('errorMotDePasseConfirmSignup').textContent = 'Les mots de passe ne correspondent pas.';
                return;
            }

            const { user, error } = await supabase.auth.signUp({
                email: email,
                password: password
            }, {
                data: {
                    full_name: fullName
                }
            });

            if (error) {
                console.log(error.message);
                document.getElementById('errorEmailSignup').textContent = error.message;
            } else {
                alert("Inscription réussie avec succès");
            }
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('emailLogin').value;
            const password = document.getElementById('mot_de_passeLogin').value;

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.log(error.message);
                document.getElementById('errorEmailLogin').textContent = error.message;
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            window.location.href = 'index.html';
        }
    });
}
