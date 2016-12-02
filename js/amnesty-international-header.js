document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    let navBtn          = document.querySelector('.nav-btn'),
        nav             = document.querySelector('.nav'),
        navOverlay      = document.querySelector('.nav-overlay'),
        navOptionsClose = document.querySelector('.nav-options__close');

    navBtn.addEventListener('click', () => {
        nav.classList.add('is-active');
        nav.setAttribute('aria-expanded', 'true');
        navOverlay.classList.add('nav-overlay--visible');
    });

    navOverlay.addEventListener('click', () => {
        nav.classList.remove('is-active');
        nav.setAttribute('aria-expanded', 'false');
        navOverlay.classList.remove('nav-overlay--visible');
    });

    navOptionsClose.addEventListener('click', () => {
        nav.classList.remove('is-active');
        nav.setAttribute('aria-expanded', 'false');
        navOverlay.classList.remove('nav-overlay--visible');
    });
});
