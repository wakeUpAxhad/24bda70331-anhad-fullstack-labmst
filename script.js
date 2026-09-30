const form = document.querySelector('#booking-form');
const message = document.querySelector('#form-message');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const doctorSelect = form.querySelector('[name="doctor"]');

document.querySelectorAll('[data-select-doctor]').forEach((link) => {
  link.addEventListener('click', () => {
    doctorSelect.value = link.dataset.selectDoctor;
  });
});

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  menuButton.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
  nav.classList.toggle('open', !open);
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const payload = {};
  data.forEach((value, key) => {
    payload[key] = value;
  });
  message.classList.add('visible');
  message.textContent = 'Sending your request…';
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  try {
    const response = await fetch('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Your request could not be submitted.');
    const receipt = {
      id: result.id,
      name: result.name,
      doctor: result.doctor.name,
      specialty: result.doctor.specialty,
      reason: payload.reason.trim(),
      createdAt: result.createdAt
    };
    localStorage.setItem(`consultation-receipt:${result.id}`, JSON.stringify(receipt));
    window.location.assign(`/receipt?id=${encodeURIComponent(result.id)}`);
  } catch (error) {
    message.textContent = error.message === 'Failed to fetch'
      ? 'The booking server is not running. Start it with “npm start”, then open this site at http://127.0.0.1:8080.'
      : error.message;
  } finally {
    submitButton.disabled = false;
  }
  message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
