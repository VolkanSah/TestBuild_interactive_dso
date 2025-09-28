// marker.js - Map Interaction & Marker Rendering

// marker.js " Private license" copyright volkan kücükbudak
// You may not use my marker without my permission

document.addEventListener('DOMContentLoaded', function() {
    const mapContainer = document.getElementById('map-container');
    const mainMap = document.getElementById('main-map');
    
    mapContainer.addEventListener('click', function(event) {
        if (event.target !== mainMap) return; 
        
        const rect = mainMap.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        
        // Ruft die Funktion aus main.js ab (funktioniert jetzt sofort)
        const id = window.getNextMarkerId ? window.getNextMarkerId() : Date.now(); 
        
        const marker = createMarker(x, y, id);
        mapContainer.appendChild(marker);
        
        if (window.openMarkerConfig) {
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
            const newX = ((event.clientX - mapRect.left) / mapRect.width) * 100;
            const newY = ((event.clientY - mapRect.top) / mapRect.height) * 100;
            const finalX = Math.max(0, Math.min(100, newX));
            const finalY = Math.max(0, Math.min(100, newY));

            marker.style.left = `${finalX}%`;
            marker.style.top = `${finalY}%`;
            
            if (window.updateMarkerPosition) {
                window.updateMarkerPosition(id, finalX.toFixed(2), finalY.toFixed(2));
            }
        });

        marker.addEventListener('dblclick', function() {
            marker.remove();
            
            if (window.removeMarkerData) {
                window.removeMarkerData(id);
            }
        });

        marker.addEventListener('click', function(event) {
            event.stopPropagation(); 
            if (window.openMarkerConfig) {
                const currentX = parseFloat(marker.style.left.replace('%', ''));
                const currentY = parseFloat(marker.style.top.replace('%', ''));
                window.openMarkerConfig(id, currentX, currentY);
            }
        });

        return marker;
    }
});
