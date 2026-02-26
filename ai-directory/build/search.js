// Simple client-side search
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search');
  if (!searchInput) return;
  
  const toolCards = document.querySelectorAll('.tool-card');
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    toolCards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? '' : 'none';
    });
  });
});
