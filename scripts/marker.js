// marker.js " Private license" copyright volkan kücükbudak
// Marker-Logik: Verantwortlich für Platzierung, Verschiebung und Löschung der visuellen Marker.
// Die Konfiguration der Lager-Details erfolgt durch Aufruf einer Funktion in main.js.

document.addEventListener('DOMContentLoaded', function() {
    const mapContainer = document.getElementById('map-container');
    const mainMap = document.getElementById('main-map');
    // Die Lager-Liste wird nur noch für das Aufräumen von IDs benötigt, nicht für die UI-Erstellung.
    const lagerList = document.getElementById('lager-list'); 
    let markerId = 0; // Wird später durch den Lade-Zustand (localStorage) überschrieben

    // Globale Funktion, die aufgerufen wird, wenn ein Marker zur Bearbeitung angeklickt wird.
    // MUSS in main.js definiert sein.
    const editMarker = window.openMarkerConfig || console.error.bind(console, "openMarkerConfig ist in main.js nicht definiert.");

    // Event-Listener: Marker bei Klick auf die leere Karte erstellen
    mapContainer.addEventListener('click', function(event) {
        if (event.target !== mainMap) return; 
        
        const rect = mainMap.getBoundingClientRect();
        // Berechne die prozentuale Position
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        
        markerId++; // Neue ID zuweisen
        
        const marker = createMarker(x, y, markerId);
        mapContainer.appendChild(marker);
        
        // Initialen Konfigurationseintrag im Hauptskript (main.js) erstellen/speichern
        editMarker(markerId, { x: `${x}%`, y: `${y}%` }); 
    });

    /**
     * Erstellt das Marker-DOM-Element.
     */
    function createMarker(x, y, id) {
        const marker = document.createElement('div');
        marker.className = 'pointer';
        marker.dataset.markerId = id; // Speichere die ID als Attribut
        marker.style.left = `${x}%`;
        marker.style.top = `${y}%`;
        marker.style.width = '30px'; 
        marker.style.height = '30px'; 
        marker.textContent = id;
        marker.draggable = true;

        // **NEU:** Klick-Handler zum Bearbeiten der Konfiguration
        marker.addEventListener('click', function(event) {
            // Verhindert das Auslösen des mapContainer-Klicks
            event.stopPropagation(); 
            // Öffne das Konfigurations-Panel in main.js
            editMarker(id); 
        });

        // Drag-Handler: Position nach Verschieben aktualisieren und speichern
        marker.addEventListener('dragend', function(event) {
            const mapRect = mapContainer.getBoundingClientRect();
            const newX = ((event.clientX - mapRect.left) / mapRect.width) * 100;
            const newY = ((event.clientY - mapRect.top) / mapRect.height) * 100;
            marker.style.left = `${newX}%`;
            marker.style.top = `${newY}%`;
            
            // Speichere die neue Position und den Zustand
            editMarker(id, { x: `${newX}%`, y: `${newY}%` }, true); // true = nur Position updaten
            // updateLagerList(); // Nicht nötig, da Lagerliste jetzt in main.js verwaltet wird
        });

        // Doppelklick-Handler: Marker und zugehörige Daten löschen
        marker.addEventListener('dblclick', function() {
            marker.remove();
            // Rufe globale Funktion zum Entfernen der Daten auf (muss in main.js definiert sein)
            if (window.removeMarkerData) {
                window.removeMarkerData(id);
            }
            updateMarkerIds(); // ID-Zähler und visuelle Anzeige aktualisieren
        });

        return marker;
    }

    /**
     * Korrigiert die IDs der existierenden Marker und den Zähler.
     * Wird nach dem Löschen eines Markers aufgerufen.
     */
    function updateMarkerIds() {
        markerId = 0;
        Array.from(mapContainer.children).forEach(marker => {
            if (marker.className === 'pointer') {
                markerId++;
                marker.textContent = markerId;
                marker.dataset.markerId = markerId; 
                // Optional: Muss die ID im zentralen Zustand in main.js aktualisieren.
            }
        });
        // Die Lagerliste (UI) muss NICHT mehr hier aktualisiert werden.
    }
    
    // Globale Funktion für main.js, um Marker von localStorage wiederherzustellen
    window.restoreMarker = (id, x, y) => {
        const marker = createMarker(parseFloat(x), parseFloat(y), id);
        mapContainer.appendChild(marker);
        markerId = Math.max(markerId, id); // Stellt sicher, dass der Zähler nicht zurückspringt
    };

});
