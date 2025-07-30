// search.js
// Handles search result click: scroll and highlight menu item

function highlightAndScrollToMenuItem(itemId) {
    // Remove highlight from all menu items
    document.querySelectorAll('.dish-box-wp').forEach(function(el){
        el.classList.remove('search-highlight');
    });
    // Find the matched menu item
    var el = document.querySelector('[data-item-id="' + itemId + '"]');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('search-highlight');
        setTimeout(function(){
            el.classList.remove('search-highlight');
        }, 3000);
    }
}

// Attach to search result click
const dropdown = document.getElementById('menu-search-dropdown');
dropdown.addEventListener('mousedown', function(e) {
    const target = e.target.closest('.search-result-item');
    if (target && target.dataset.itemId) {
        highlightAndScrollToMenuItem(target.dataset.itemId);
    }
});

// CSS for highlight (add to style.css):
// .search-highlight {
//     background: yellow !important;
//     box-shadow: 0 0 10px 3px orange !important;
//     transition: background 0.3s, box-shadow 0.3s;
// }
