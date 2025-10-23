import './styles.css';
import navbar from './components/navbar.html?raw';
import hero from './components/hero.html?raw';
import about from './components/about.html?raw';
import classes from './components/classes.html?raw';
import gallery from './components/gallery.html?raw';
import schedule from './components/schedule.html?raw';
import testimonials from './components/testimonials.html?raw';
import footer from './components/footer.html?raw';
import { mountParticles } from './utils/particles.js';

document.querySelector('#app').innerHTML = `${navbar}<main>${hero}${about}${classes}${gallery}${schedule}${testimonials}</main>${footer}`;
mountParticles();
