const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const card = document.querySelector('#receipt-card');
const missing = document.querySelector('#receipt-missing');
let receipt;

try {
  receipt = id ? JSON.parse(localStorage.getItem(`consultation-receipt:${id}`)) : null;
} catch {
  receipt = null;
}

if (!receipt || receipt.id !== id) {
  missing.hidden = false;
} else {
  card.hidden = false;
  document.querySelector('#receipt-name').textContent = receipt.name;
  document.querySelector('#receipt-id').textContent = receipt.id;
  document.querySelector('#receipt-doctor').textContent = receipt.doctor;
  document.querySelector('#receipt-specialty').textContent = receipt.specialty;
  document.querySelector('#receipt-reason').textContent = receipt.reason;
  const submitted = new Date(receipt.createdAt);
  document.querySelector('#receipt-date').textContent = Number.isNaN(submitted.getTime()) ? 'Date unavailable' : submitted.toLocaleString();
}

document.querySelector('#print-receipt').addEventListener('click', () => window.print());
document.querySelector('#copy-id').addEventListener('click', async (event) => {
  try {
    await navigator.clipboard.writeText(id);
    event.currentTarget.textContent = 'Copied';
  } catch {
    event.currentTarget.textContent = 'Select the ID to copy';
  }
});
