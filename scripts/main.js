// main.js - State Management & UI Control
// Enthält alle Daten, die Logik für Karten- und General-Selektoren, 
// die Lager-Liste und Funktionen, die von marker.js benötigt werden.

// Data and State storage
let allGenerals = [];
let allUnits = [];
let allAdventures = [];
let allMaps = [];
let markerData = {}; // Stores all marker configurations: {id: {x, y, waves: [...]}}
let markerIdCounter = 0;

document.addEventListener('DOMContentLoaded', async function() {
    const mapSelector = document.getElementById('map-selector');
    const mainMap = document.getElementById('main-map');
    const adventureType = document.getElementById('adventure-type');
    const adventureLevel = document.getElementById('adventure-level');
    const adventurePlayers = document.getElementById('adventure-players');
    const lagerList = document.getElementById('lager-list');

    // --- Data Loading Functions ---
    async function loadData() {
        // Lädt alle JSON-Dateien parallel
        const [generalsRes, unitsRes, mapsRes, mapLoaderRes] = await Promise.all([
            fetch('data/generals.json'),
            fetch('data/units.json'),
            fetch('data/maps.json'),
            fetch('data/map_loader.json')
        ]);
        allGenerals = (await generalsRes.json()).generals;
        allUnits = (await unitsRes.json()).units;
        allAdventures = (await mapsRes.json()).abenteuer;
        allMaps = (await mapLoaderRes.json()).map_loader;
    }

    // --- Map Selector Logic ---
    function populateMapSelector() {
        allMaps.forEach(map => {
            const option = document.createElement('option');
            option.value = map.at_img;
            option.textContent = map.at_loader_name;
            mapSelector.appendChild(option);
        });
        
        // Wählt die erste Karte aus und aktualisiert die Anzeige.
        // Behebt den 'selectedOption is undefined' Fehler, da nun garantiert eine Option ausgewählt ist.
        if (allMaps.length > 0) {
            mapSelector.selectedIndex = 0;
            updateMapAndDetails();
        }
    }

    function showAdventureDetails(selectedMapName) {
        const adventure = allAdventures.find(a => a.Abenteuer === selectedMapName);

        if (adventure) {
            adventureType.textContent = `Zuordnung: ${adventure.Zuordnung}`;
            adventureLevel.textContent = `Level: ${adventure.Level}`;
            adventurePlayers.textContent = `Spieler: ${adventure['Spieler-Min']} - ${adventure['Spieler-Max']}`;
        } else {
            adventureType.textContent = 'Zuordnung: N/A';
            adventureLevel.textContent = 'Level: N/A';
            adventurePlayers.textContent = 'Spieler: N/A';
        }
    }

    function updateMapAndDetails() {
        const selectedOption = mapSelector.options[mapSelector.selectedIndex];
        
        if (!selectedOption) return; // Sollte durch populateMapSelector behoben sein, aber zur Sicherheit
        
        const selectedMapName = selectedOption.textContent;
        const imgSrc = selectedOption.value;
        
        mainMap.src = imgSrc;
        showAdventureDetails(selectedMapName);
    }

    mapSelector.addEventListener('change', updateMapAndDetails);
    
    // --- Marker/Lager Logic Functions (Exposed to marker.js) ---
    
    function getNextMarkerId() {
        return ++markerIdCounter;
    }
    
    /**
     * Called by marker.js on marker creation or click. 
     * Creates or updates the marker's data object and config UI in the list.
     */
    function openMarkerConfig(id, x, y) {
        if (!markerData[id]) {
            markerData[id] = { 
                id: id, 
                x: x, 
                y: y, 
                waves: [{ general: '', unitType: 'normal', units: {} }] // Minimal initial structure
            };
        }
        
        // Stellt die UI für diesen Marker in der Lager-Liste her/aktualisiert sie
        addMarkerConfigToList(markerData[id]);
        
        console.log(`Marker ${id} configured at (${x}, ${y}). Data:`, markerData[id]);
    }
    
    /**
     * Called by marker.js on dblclick removal. 
     * Removes marker data and re-indexes all remaining markers.
     */
    function removeMarkerData(id) {
        delete markerData[id];
        removeLagerFromList(id);
        
        // Re-nummeriert Marker und aktualisiert Liste/Daten
        updateAllMarkerIds(); 
    }
    
    /**
     * Called by marker.js on dragend.
     * Updates the data position.
     */
    function updateMarkerPosition(id, newX, newY) {
        if (markerData[id]) {
            markerData[id].x = newX;
            markerData[id].y = newY;
            console.log(`Marker ${id} position updated to (${newX}, ${newY})`);
        }
    }

    // --- Configuration UI Generation (General, Units) ---
    
    function populateGeneralSelector(selector, currentGeneralName) {
        selector.innerHTML = '<option value="">General wählen</option>';
        allGenerals.forEach(general => {
            const option = document.createElement('option');
            option.value = general.name;
            option.textContent = general.name;
            if (general.name === currentGeneralName) {
                 option.selected = true;
            }
            selector.appendChild(option);
        });
    }

    function populateUnitInputs(unitsContainer, selectedType) {
        unitsContainer.innerHTML = ''; 
        const filteredUnits = allUnits.filter(unit => unit.type === selectedType);

        filteredUnits.forEach(unit => {
            const unitDiv = document.createElement('div');
            unitDiv.innerHTML = `
                <img src="${unit.unit_img || unit.unit_name}" alt="${unit.name}" style="width: 30px; height: 30px;">
                <input type="number" name="unit_${unit.name}" placeholder="Anzahl ${unit.name}" step="1" min="0" max="200" required>
            `;
            unitsContainer.appendChild(unitDiv);
        });
    }

    function addMarkerConfigToList(data) {
        const id = data.id;
        let listItem = document.getElementById(`lager-item-${id}`);
        if (listItem) {
            // Wenn Element existiert, nur die inneren Daten aktualisieren (optional)
        } else {
            listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.id = `lager-item-${id}`;
            lagerList.appendChild(listItem);
        }

        // Generiere die komplexe HTML-Struktur
        listItem.innerHTML = `
            <div>
                Lager ${id}
                <input type="number" name="wellen_anzahl" placeholder="0" step="1" value="1" min="0" max="25" required>
                <select name="general_type_select" id="general-type-select-${id}"></select>
                <input type="number" name="skill_garnisonsanbau" placeholder="0" step="5" min="0" max="15" required>
                <input type="color" name="general_color" value="#ff0000">
                <select name="units_type_select" id="units-type-select-${id}">
                    <option value="">Einheitstype</option>
                    <option value="normal">Kaserne</option>
                    <option value="elite-einheiten">Elite</option>
                </select>
                <div id="units-container-${id}"></div>
            </div>
        `;

        // Fülle Generals und hänge Event-Listener an
        const generalSelector = document.getElementById(`general-type-select-${id}`);
        populateGeneralSelector(generalSelector, data.waves[0].general);
        
        const unitsTypeSelect = document.getElementById(`units-type-select-${id}`);
        const unitsContainer = document.getElementById(`units-container-${id}`);

        // Fügt den Event-Listener für den Gerätetyp-Wechsel hinzu
        unitsTypeSelect.addEventListener('change', function(event) {
            const selectedType = event.target.value;
            populateUnitInputs(unitsContainer, selectedType);
        });
        
        // Initiales Befüllen der Einheiten
        if (data.waves[0].unitType) {
            unitsTypeSelect.value = data.waves[0].unitType;
            populateUnitInputs(unitsContainer, data.waves[0].unitType);
        }
    }

    function removeLagerFromList(id) {
        const listItem = document.getElementById(`lager-item-${id}`);
        if (listItem) {
            listItem.remove();
        }
    }
    
    function updateAllMarkerIds() {
        const mapContainer = document.getElementById('map-container');
        const markers = Array.from(mapContainer.querySelectorAll('.pointer'));
        
        lagerList.innerHTML = '';
        markerIdCounter = 0;
        let newMarkerData = {};
        
        // Gehe alle Marker durch, nummeriere neu (1, 2, 3...)
        markers.forEach((marker, index) => {
            const oldId = marker.id.replace('marker-', '');
            const newId = index + 1;
            
            // Marker DOM aktualisieren
            marker.id = `marker-${newId}`;
            marker.textContent = newId;
            
            // markerData aktualisieren
            if (markerData[oldId]) {
                 newMarkerData[newId] = {...markerData[oldId], id: newId};
            }
            
            // Liste aktualisieren (neu hinzufügen, um die korrekte Reihenfolge zu gewährleisten)
            if (newMarkerData[newId]) {
                addMarkerConfigToList(newMarkerData[newId]);
            }
            
            markerIdCounter = newId;
        });

        markerData = newMarkerData; // Überschreibe alte Daten mit neu indexierten Daten
    }
    
    // --- Initialisierung & Globale Exposition ---
    await loadData(); // Lädt alle JSON-Daten
    populateMapSelector(); // Füllt Map Dropdown und zeigt initiale Map
    
    // Expose die notwendigen Funktionen für marker.js, um den ReferenceError zu beheben.
    window.openMarkerConfig = openMarkerConfig;
    window.removeMarkerData = removeMarkerData;
    window.updateMarkerPosition = updateMarkerPosition;
    window.getNextMarkerId = getNextMarkerId;
});
