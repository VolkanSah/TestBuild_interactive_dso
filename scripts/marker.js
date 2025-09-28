// marker.js
// Logik: Verantwortlich FÜR die Visualisierung und Steuerung der Marker auf der Karte.
// Speicherung und Konfiguration werden komplett an main.js delegiert.

document.addEventListener('DOMContentLoaded', function() {
    const mapContainer = document.getElementById('map-container');
    const mainMap = document.getElementById('main-map');
    
    // Der globale Zähler wird nun auch über die globale Funktion in main.js manipuliert.
    let markerId = 0; 
    
    // Globale Schnittstellen zu main.js
    const editMarker = window.openMarkerConfig || console.error.bind(console, "openMarkerConfig ist in main.js nicht definiert.");
    const deleteMarkerData = window.removeMarkerData || console.error.bind(console, "removeMarkerData ist in main.js nicht definiert.");

    // Event-Listener: Marker bei Klick auf die leere Karte erstellen
    mapContainer.addEventListener('click', function(event) {
        if (event.target !== mainMap) return; 
        
        const rect = mainMap.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        
        markerId++; 
        
        const marker = createMarker(x, y, markerId);
        mapContainer.appendChild(marker);
        
        // 1. Neuen Zustand in main.js erstellen und Konfigurations-Panel öffnen
        editMarker(markerId, { x: `${x}%`, y: `${y}%` }); 
        
        // 2. Zustand speichern (wird in editMarker/openMarkerConfig ausgelöst)
    });

    /**
     * Erstellt das Marker-DOM-Element.
     */
    function createMarker(x, y, id) {
        const marker = document.createElement('div');
        marker.className = 'pointer';
        marker.dataset.markerId = id; 
        marker.style.left = `${x}%`;
        marker.style.top = `${y}%`;
        marker.style.width = '30px'; 
        marker.style.height = '30px'; 
        marker.textContent = id;
        marker.draggable = true;

        // Klick-Handler: Öffnet das Konfigurations-Panel
        marker.addEventListener('click', function(event) {
            event.stopPropagation(); 
            editMarker(id); 
        });

        // Drag-Handler: Aktualisiert Position und speichert Zustand in main.js
        marker.addEventListener('dragend', function(event) {
            const mapRect = mapContainer.getBoundingClientRect();
            const newX = ((event.clientX - mapRect.left) / mapRect.width) * 100;
            const newY = ((event.clientY - mapRect.top) / mapRect.height) * 100;
            
            // Marker visuell korrigieren
            marker.style.left = `${newX}%`;
            marker.style.top = `${newY}%`;
            
            // Ruft main.js auf: nur Position updaten, kein Panel öffnen
            editMarker(id, { x: `${newX}%`, y: `${newY}%` }, true); 
        });

        // Doppelklick-Handler: Marker und zugehörige Daten löschen
        marker.addEventListener('dblclick', function() {
            marker.remove();
            deleteMarkerData(id); // Daten in main.js löschen
            updateVisualMarkerIds(); // ID-Zähler visuell aktualisieren
        });

        return marker;
    }

    /**
     * Korrigiert die IDs der existierenden Marker und den Zähler.
     * HINWEIS: Dies ist nur für die visuelle Anzeige nötig. Die ID im State bleibt erhalten.
     */
    function updateVisualMarkerIds() {
        let currentId = 0;
        Array.from(mapContainer.children).forEach(marker => {
            if (marker.className === 'pointer') {
                currentId++;
                marker.textContent = currentId;
                // WICHTIG: Die data-marker-Id bleibt die ursprünglich vergebene ID für den State!
                // Nur der Text-Content ändert sich, um eine fortlaufende Nummerierung auf der Karte zu zeigen.
            }
        });
        // Setzt den Zähler auf die höchste aktuell angezeigte ID zurück
        markerId = currentId;
    }
    
    // Globale Funktion für main.js, um Marker von localStorage wiederherzustellen
    window.restoreMarker = (id, x, y) => {
        // Erstellt den Marker mit der originalen ID aus dem State
        const marker = createMarker(parseFloat(x), parseFloat(y), id);
        mapContainer.appendChild(marker);
        // Da die IDs beim Laden unsortiert sein können, wird der Zähler in main.js gesetzt.
    };
    
    // Globale Funktion, um den internen Zähler aus main.js zu setzen
    window.setMarkerIdCounter = function(maxId) {
        markerId = maxId;
        updateVisualMarkerIds(); // Stellt sicher, dass die visuelle Zählung startet
    };

});
