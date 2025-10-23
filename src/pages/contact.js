import '../styles.css';
import navbar from '../components/navbar.html?raw';
import contact from '../components/contact.html?raw';
import footer from '../components/footer.html?raw';

document.querySelector('#app').innerHTML = `
  ${navbar}
  <main>
    <section class="section pt-36">
      <div class="mx-auto max-w-4xl px-6 text-center">
        <h1 class="font-serif text-4xl md:text-5xl">Contact</h1>
        <p class="mt-4 opacity-80">Questions, privates, collaborations—say hello.</p>
      </div>
    </section>
    ${contact}
  </main>
  ${footer}
`;
