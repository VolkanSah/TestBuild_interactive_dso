// marker.js - Map Interaction & Marker Rendering
// Enthält nur die Logik zur Platzierung, Bewegung und Löschung von Markern
// und ruft Funktionen in main.js zur Daten- und UI-Verwaltung auf.

// marker.js " Private license" copyright volkan kücükbudak
// You may not use my marker without my permission

document.addEventListener('DOMContentLoaded', function() {
    const mapContainer = document.getElementById('map-container');
    const mainMap = document.getElementById('main-map');
    
    mapContainer.addEventListener('click', function(event) {
        // Platziere den Marker nur, wenn auf die Karte selbst geklickt wird
        if (event.target !== mainMap) return; 
        
        const rect = mainMap.getBoundingClientRect();
        // Berechne die Position in Prozent relativ zur Karte
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        
        // Ruft die Funktion aus main.js ab, um die nächste ID zu erhalten
        const id = window.getNextMarkerId ? window.getNextMarkerId() : Date.now(); 
        
        const marker = createMarker(x, y, id);
        mapContainer.appendChild(marker);
        
        // Benachrichtigt main.js, die Daten zu speichern und das Konfigurations-UI zu öffnen
        if (window.openMarkerConfig) {
            // Übergebe gerundete Werte, um Speicherplatz zu sparen und float-Fehler zu vermeiden
            window.openMarkerConfig(id, x.toFixed(2), y.toFixed(2));
        }
    });

    function createMarker(x, y, id) {
        const marker = document.createElement('div');
        marker.id = `marker-${id}`; 
        marker.className = 'pointer';
        marker.style.left = `${x}%`;
        marker.style.top = `${y}%`;
        marker.style.width = '30px';
        marker.style.height = '30px';
        marker.textContent = id;
        marker.draggable = true;

        marker.addEventListener('dragend', function(event) {
            const mapRect = mapContainer.getBoundingClientRect();
            
            // Neue Position in Prozent berechnen
            const newX = ((event.clientX - mapRect.left) / mapRect.width) * 100;
            const newY = ((event.clientY - mapRect.top) / mapRect.height) * 100;
            
            // Position auf die Karte begrenzen
            const finalX = Math.max(0, Math.min(100, newX));
            const finalY = Math.max(0, Math.min(100, newY));

            marker.style.left = `${finalX}%`;
            marker.style.top = `${finalY}%`;
            
            // Benachrichtigt main.js über die neue Position
            if (window.updateMarkerPosition) {
                window.updateMarkerPosition(id, finalX.toFixed(2), finalY.toFixed(2));
            }
        });

        marker.addEventListener('dblclick', function() {
            marker.remove();
            
            // Benachrichtigt main.js, die Daten zu löschen und IDs neu zu vergeben
            if (window.removeMarkerData) {
                window.removeMarkerData(id);
            }
        });

        // Klick, um Konfigurationspanel erneut zu öffnen
        marker.addEventListener('click', function(event) {
            event.stopPropagation(); 
            if (window.openMarkerConfig) {
                // Lese aktuelle Position aus den Style-Eigenschaften
                const currentX = parseFloat(marker.style.left.replace('%', ''));
                const currentY = parseFloat(marker.style.top.replace('%', ''));
                window.openMarkerConfig(id, currentX, currentY);
            }
        });

        return marker;
    }
});
