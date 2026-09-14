/* ================= MOBILE MENU ================= */

const menuToggle =
    document.getElementById("menu-toggle");

const navMenu =
    document.querySelector(".nav-menu");


menuToggle.addEventListener("click", () => {

    navMenu.classList.toggle("active");

});


const navLinks =
    document.querySelectorAll(".nav-menu a");


navLinks.forEach((link) => {

    link.addEventListener("click", () => {

        navMenu.classList.remove("active");

    });

});


/* ================= HERO ANIMATION ================= */

const heroElements =
    document.querySelectorAll(".hero-animation");


window.addEventListener("load", () => {

    heroElements.forEach((element, index) => {

        setTimeout(() => {

            element.classList.add("show");

        }, index * 200);

    });

});


/* ================= TYPING EFFECT ================= */

const typingText =
    document.getElementById("typing-text");


const texts = [
    "Programmer",
    "Web Developer",
    "Game Developer"
];


let textIndex = 0;

let charIndex = 0;

let isDeleting = false;


function typeEffect() {

    const currentText =
        texts[textIndex];


    /* MENGETIK */

    if (!isDeleting) {

        typingText.textContent =
            currentText.substring(
                0,
                charIndex + 1
            );

        charIndex++;

    }


    /* MENGHAPUS */

    else {

        typingText.textContent =
            currentText.substring(
                0,
                charIndex - 1
            );

        charIndex--;

    }


    /* TULISAN SELESAI */

    if (
        !isDeleting &&
        charIndex === currentText.length
    ) {

        isDeleting = true;

        setTimeout(
            typeEffect,
            1500
        );

        return;
    }


    /* TULISAN SUDAH TERHAPUS */

    if (
        isDeleting &&
        charIndex === 0
    ) {

        isDeleting = false;

        textIndex++;


        if (
            textIndex >= texts.length
        ) {

            textIndex = 0;

        }

    }


    const speed =
        isDeleting
            ? 50
            : 100;


    setTimeout(
        typeEffect,
        speed
    );

}


typeEffect();


/* ================= SCROLL REVEAL ================= */

const revealElements =
    document.querySelectorAll(".reveal");


function revealOnScroll() {

    revealElements.forEach((element) => {

        const elementTop =
            element.getBoundingClientRect().top;


        const windowHeight =
            window.innerHeight;


        if (
            elementTop <
            windowHeight - 100
        ) {

            element.classList.add("active");

        }

    });

}


window.addEventListener(
    "scroll",
    revealOnScroll
);


revealOnScroll();