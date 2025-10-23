import '../styles.css';
import navbar from '../components/navbar.html?raw';
import schedule from '../components/schedule.html?raw';
import footer from '../components/footer.html?raw';

document.querySelector('#app').innerHTML = `
  ${navbar}
  <main>
    <section class="section pt-36">
      <div class="mx-auto max-w-4xl px-6 text-center">
        <h1 class="font-serif text-4xl md:text-5xl">Schedule</h1>
        <p class="mt-4 opacity-80">Find your time and we’ll hold the space.</p>
      </div>
    </section>
    ${schedule}
  </main>
  ${footer}
`;
