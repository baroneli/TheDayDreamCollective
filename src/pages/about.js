import '../styles.css';
import navbar from '../components/navbar.html?raw';
import about from '../components/about.html?raw';
import footer from '../components/footer.html?raw';

document.querySelector('#app').innerHTML = `
  ${navbar}
  <main>
    <section class="section pt-36">
      <div class="mx-auto max-w-4xl px-6 text-center">
        <h1 class="font-serif text-4xl md:text-5xl">About the Studio</h1>
        <p class="mt-4 opacity-80">Designed as a portal to calm—golden hour, always.</p>
      </div>
    </section>
    ${about}
  </main>
  ${footer}
`;
