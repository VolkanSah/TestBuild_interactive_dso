/**
 * main.js - Kernlogik für den DSO Taktik-Editor (KORRIGIERT).
 * Verantwortlich für State Management, Daten-Loading und globale Schnittstellen.
 */

// Globaler Zustand und Daten
let allGenerals = [];
let allUnits = [];
let allAdventures = [];
let allMaps = [];
let markerData = {}; // {id: {x, y, waves: [...]}}
let markerIdCounter = 0;

document.addEventListener('DOMContentLoaded', async function() {
    const mapSelector = document.getElementById('map-selector');
    const mainMap = document.getElementById('main-map');
    const adventureType = document.getElementById('adventure-type');
    const adventureLevel = document.getElementById('adventure-level');
    const adventurePlayers = document.getElementById('adventure-players');
    const lagerList = document.getElementById('lager-list');

    // --- HILFSFUNKTIONEN (Lokal definiert) ---

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

    function showAdventureDetails(selectedMapName) {
        const adventure = allAdventures.find(a => a.Abenteuer === selectedMapName);
        // ... (Details anzeigen) ...
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

    // BEHEBT TypeError: can't access property "text", selectedOption is undefined
    function updateMapAndDetails() {
        const selectedOption = mapSelector.options[mapSelector.selectedIndex];
        
        if (!selectedOption) return; // Sicherheits-Check
        
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
        
        // Initialisiere die Karte und Details, um den Fehler zu vermeiden
        if (allMaps.length > 0) {
            mapSelector.selectedIndex = 0;
            updateMapAndDetails(); 
        }
    }
    
    // --- Marker/Lager Konfigurations-Logik ---

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

        // ... (komplette HTML-Struktur) ...
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
        // populateGeneralSelector ist hier im Scope (kein ReferenceError)
        populateGeneralSelector(generalSelector, data.waves[0].general);
        
        const unitsTypeSelect = document.getElementById(`units-type-select-${id}`);
        const unitsContainer = document.getElementById(`units-container-${id}`);

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
    
    // --- GLOBALE SCHNITTSTELLEN (Für marker.js) ---

    // Exponiere die Funktionen, um den ReferenceError zu beheben.
    window.getNextMarkerId = function() { return ++markerIdCounter; };
    
    window.openMarkerConfig = function(id, x, y) {
        if (!markerData[id]) {
            markerData[id] = { 
                id: id, 
                x: x, 
                y: y, 
                waves: [{ general: '', unitType: 'normal', units: {} }]
            };
        }
        addMarkerConfigToList(markerData[id]);
        // TODO: Konfigurationspanel anzeigen
    };
    
    window.removeMarkerData = function(id) {
        delete markerData[id];
        removeLagerFromList(id);
        // Da die ID-Logik jetzt in main.js liegt, müsste hier auch das Re-Indexing passieren
        updateAllMarkerIds(); 
    };

    window.updateMarkerPosition = function(id, newX, newY) {
        if (markerData[id]) {
            markerData[id].x = newX;
            markerData[id].y = newY;
        }
    };
    
    function updateAllMarkerIds() {
        // Die Logik für das Neunummerieren der Marker auf der Karte und in den Daten
        // ist komplexer und sollte hier nach Bedarf implementiert werden.
        // Fürs Erste: Nur die Zählerlogik zurücksetzen und die Liste aufräumen.
        // Die eigentliche Neunummerierung der Marker-Elemente erfolgt im marker.js
    }
    
    // --- INITIALISIERUNG ---
    await loadData();
    populateMapSelector(); // Füllt Map Dropdown und zeigt initiale Map
    
    mapSelector.addEventListener('change', updateMapAndDetails);
});
