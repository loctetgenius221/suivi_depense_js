// @ts-nocheck
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://rbqzjfxvniviaupdmrpy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicXpqZnh2bml2aWF1cGRtcnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEzMTY5NzAsImV4cCI6MjAzNjg5Mjk3MH0.SNuKv6F5XU8FK6oDuD5S5rJF25fh7Cjh91TVcjpYc6o';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.querySelector('.menu-button img');
    const closeButton = document.querySelector('.close-button');
    const sidebar = document.getElementById('sidebar');

    menuButton.addEventListener('click', function() {
        sidebar.classList.add('open');
        menuButton.style.display = 'none';
    });

    closeButton.addEventListener('click', function() {
        sidebar.classList.remove('open');
        menuButton.style.display = 'block';
    });

    document.getElementById('logout').addEventListener('click', async function() {
      // Pour que la function marche il fallait la rendre asynchrone
        // Ajoutez ici la logique de déconnexion
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.log('Error during logout:', error.message);
        } else {
            window.location.href = 'authen.html';
        }
    });
});

// Form handling
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const switchToLoginBtn = document.getElementById('switch-to-login');
const switchToSignupBtn = document.getElementById('switch-to-signup');

// Check which form was last used and display it
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

    let { user, error } = await supabase.auth.signUp({
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

    let { data, error } = await supabase.auth.signInWithPassword({
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

// Vérifiez si l'utilisateur est déjà connecté
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        window.location.href = 'index.html';
    }
});
