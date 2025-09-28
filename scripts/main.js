/**
 * main.js - Kernlogik für den DSO Taktik-Editor (KORRIGIERT).
 * Verantwortlich für State Management, Daten-Loading und globale Schnittstellen.
 */

// Globaler Zustand (Unmittelbar verfügbar)
let allGenerals = [];
let allUnits = [];
let allAdventures = [];
let allMaps = [];
let markerData = {}; // {id: {x, y, waves: [...]}}
let markerIdCounter = 0;
let isSystemInitialized = false;

// --- GLOBALE SCHNITTSTELLEN (SOFORT VERFÜGBAR FÜR marker.js) ---

window.getNextMarkerId = function() {
    return ++markerIdCounter;
};

// Diese Funktion wird von marker.js aufgerufen. Die interne Logik wird später definiert.
window.openMarkerConfig = function(id, x, y) {
    if (!isSystemInitialized) {
        console.warn("System nicht initialisiert. openMarkerConfig übersprungen.");
        return;
    }
    window._openMarkerConfigInternal(id, x, y);
};

window.removeMarkerData = function(id) {
    if (!isSystemInitialized) return;
    window._removeMarkerDataInternal(id);
};

window.updateMarkerPosition = function(id, newX, newY) {
    if (!isSystemInitialized) return;
    window._updateMarkerPositionInternal(id, newX, newY);
};

// --- DOMContentLoaded für Initialisierung und interne Logik ---
document.addEventListener('DOMContentLoaded', async function() {
    const mapSelector = document.getElementById('map-selector');
    const mainMap = document.getElementById('main-map');
    const adventureType = document.getElementById('adventure-type');
    const adventureLevel = document.getElementById('adventure-level');
    const adventurePlayers = document.getElementById('adventure-players');
    const lagerList = document.getElementById('lager-list');

    // --- Data Loading Functions ---
    async function loadData() {
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

    // Behebt TypeError: can't access property "text", selectedOption is undefined
    function updateMapAndDetails() {
        const selectedOption = mapSelector.options[mapSelector.selectedIndex];
        
        if (!selectedOption || mapSelector.selectedIndex === -1) {
             // Sicherstellen, dass die Initialisierung nicht fehlschlägt, falls keine Option existiert
             console.warn("Karten-Option nicht gefunden oder nicht ausgewählt.");
             return; 
        }
        
        const selectedMapName = selectedOption.textContent;
        const imgSrc = selectedOption.value;
        
        mainMap.src = imgSrc;
        showAdventureDetails(selectedMapName);
    }

    function populateMapSelector() {
        allMaps.forEach(map => {
            const option = document.createElement('option');
            option.value = map.at_img;
            option.textContent = map.at_loader_name;
            mapSelector.appendChild(option);
        });
        
        if (allMaps.length > 0) {
            mapSelector.selectedIndex = 0; // Wählt die erste Option
            updateMapAndDetails(); // Initialisiert die Ansicht sofort
        }
    }
    
    // --- Marker/Lager Konfigurations-Logik ---

    // Behebt den internen ReferenceError, da diese Funktion nun im gleichen Closure liegt
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
        
        if (!listItem) {
            listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.id = `lager-item-${id}`;
            lagerList.appendChild(listItem);
        }

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

        const generalSelector = document.getElementById(`general-type-select-${id}`);
        populateGeneralSelector(generalSelector, data.waves[0].general);
        
        const unitsTypeSelect = document.getElementById(`units-type-select-${id}`);
        const unitsContainer = document.getElementById(`units-container-${id}`);

        unitsTypeSelect.addEventListener('change', function(event) {
            const selectedType = event.target.value;
            populateUnitInputs(unitsContainer, selectedType);
        });
        
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
        // Implementiere Re-Indexing hier
    }
    
    // --- INTERNE IMPLEMENTIERUNGEN DER GLOBALEN FUNKTIONEN ---
    
    // Weisen Sie die interne Logik den bereits definierten globalen Funktionen zu
    window._openMarkerConfigInternal = function(id, x, y) {
        if (!markerData[id]) {
            markerData[id] = { 
                id: id, 
                x: x, 
                y: y, 
                waves: [{ general: '', unitType: 'normal', units: {} }]
            };
        }
        addMarkerConfigToList(markerData[id]);
    };

    window._removeMarkerDataInternal = function(id) {
        delete markerData[id];
        removeLagerFromList(id);
        updateAllMarkerIds(); 
    };

    window._updateMarkerPositionInternal = function(id, newX, newY) {
        if (markerData[id]) {
            markerData[id].x = newX;
            markerData[id].y = newY;
        }
    };
    
    // --- INITIALISIERUNG ---
    await loadData();
    populateMapSelector(); 
    
    mapSelector.addEventListener('change', updateMapAndDetails);
    
    isSystemInitialized = true; // System ist jetzt einsatzbereit
});
