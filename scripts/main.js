/**
 * main.js - Kernlogik für den DSO Taktik-Editor.
 * Verantwortlich für UI-Initialisierung, Daten-Loading, Zustandsverwaltung und Konfiguration.
 * Copyright (c) 2024 Volkan Sah / Open Source Community
 */

document.addEventListener('DOMContentLoaded', async function() {
    // --- KONSTANTEN
    const LOCAL_STORAGE_KEY = "TSO_EDITOR_STATE";
    const GENERAL_PLACEHOLDER_IMG = "assets/images/general/placeholder.png"; // Platzhalterbild, falls URL fehlt oder ungültig ist

    // --- UI-ELEMENTE
    const mapSelector = document.getElementById('map-selector');
    const mainMap = document.getElementById('main-map');
    const adventureType = document.getElementById('adventure-type');
    const adventureLevel = document.getElementById('adventure-level');
    const adventurePlayers = document.getElementById('adventure-players');
    const configPanel = document.getElementById('marker-config-panel'); // Das Panel zur General/Einheiten-Eingabe

    // --- DATEN-CACHE: Speichert geladene JSON-Daten (Performance-Optimierung)
    const DATA_CACHE = {};
    
    // --- ZENTRALER SPEICHER FÜR DEN ZUSTAND DER ANWENDUNG
    let editorState = {
        currentMapSrc: '',
        markers: [] // Array von { id, x, y, config: {...} }
    };
    let currentMarkerId = null; // ID des aktuell bearbeiteten Markers

    // ====================================================================
    // --- ZUSTANDSVERWALTUNG (CRUD für Marker)
    // ====================================================================

    /** Gibt die Daten des Markers zurück. */
    function getMarkerData(id) {
        return editorState.markers.find(m => m.id === id);
    }
    
    /** Fügt einen neuen Marker hinzu oder aktualisiert einen bestehenden. */
    function setMarkerData(id, data, onlyPositionUpdate = false) {
        let marker = getMarkerData(id);
        
        if (!marker) {
            // Neuer Marker
            marker = {
                id: id,
                x: data.x,
                y: data.y,
                config: {
                    generalName: "",
                    skillLevel: 0,
                    unitType: "normal",
                    units: []
                }
            };
            editorState.markers.push(marker);
        } else if (onlyPositionUpdate) {
            // Nur Position aktualisieren (nach Drag-and-Drop)
            marker.x = data.x;
            marker.y = data.y;
        } else {
            // Allgemeine Konfigurationsdaten aktualisieren (z.B. aus dem configPanel)
            Object.assign(marker.config, data.config);
        }
        
        saveEditorState();
    }

    /** Entfernt einen Marker aus dem Zustand. */
    window.removeMarkerData = function(id) {
        editorState.markers = editorState.markers.filter(m => m.id !== id);
        saveEditorState();
        if (currentMarkerId === id) {
             configPanel.style.display = 'none'; // Versteckt das Panel
        }
    };
    
    /** Stellt alle Marker visuell wieder her (von localStorage). */
    function restoreMarkers(markers) {
        let maxId = 0;
        markers.forEach(marker => {
            // Ruft die globale Funktion in marker.js auf, um den visuellen Marker zu erstellen
            if (window.restoreMarker) {
                window.restoreMarker(marker.id, marker.x, marker.y);
                maxId = Math.max(maxId, marker.id);
            }
        });
        // Setzt den Marker-Zähler in marker.js korrekt zurück
        if (window.setMarkerIdCounter) {
            window.setMarkerIdCounter(maxId);
        }
    }


    // ====================================================================
    // --- SPEICHERVERWALTUNG (localStorage)
    // ====================================================================

    /** Speichert den gesamten Editor-Zustand. */
    function saveEditorState() {
        try {
            editorState.currentMapSrc = mainMap.src;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(editorState));
        } catch (e) {
            console.error("Fehler beim Speichern in localStorage:", e);
        }
    }

    /** Lädt den letzten gespeicherten Zustand. */
    function loadEditorState() {
        try {
            const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (serializedState === null) return false;

            const state = JSON.parse(serializedState);
            editorState = state; 
            
            if (state.currentMapSrc) {
                mainMap.src = state.currentMapSrc;
            }
            
            if (state.markers && state.markers.length > 0) {
                 restoreMarkers(state.markers); 
            }
            return true;

        } catch (e) {
            console.error("Fehler beim Laden/Parsen des gespeicherten Zustands:", e);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            return false;
        }
    }

    // ====================================================================
    // --- DATENLADE-FUNKTIONEN (Caching)
    // ====================================================================

    // Generalisierte Ladefunktion mit Caching
    async function fetchDataAndCache(path, rootKey) {
        if (DATA_CACHE[rootKey]) return DATA_CACHE[rootKey];
        const response = await fetch(path);
        const data = await response.json();
        DATA_CACHE[rootKey] = data[rootKey] || data;
        return DATA_CACHE[rootKey];
    }
    
    async function loadMaps() { return fetchDataAndCache('data/map_loader.json', 'map_loader'); }
    async function loadAdventureDetails() { return fetchDataAndCache('data/maps.json', 'abenteuer'); }
    async function loadGenerals() { return fetchDataAndCache('data/generals.json', 'generals'); }
    async function loadUnits() { return fetchDataAndCache('data/units.json', 'units'); }
    
    // ====================================================================
    // --- GLOBALE SCHNITTSTELLE UND KONFIGURATION
    // ====================================================================

    /**
     * GLOBALE SCHNITTSTELLE für marker.js: Öffnet das Konfigurations-Panel 
     * für den gegebenen Marker oder speichert nur die Position.
     * @param {number} id - Die ID des Markers.
     * @param {Object} [posData] - Optional: { x, y } für Positions-Updates.
     * @param {boolean} [onlyPositionUpdate] - Ob nur die Position aktualisiert wird.
     */
    window.openMarkerConfig = async function(id, posData, onlyPositionUpdate = false) {
        currentMarkerId = id;
        
        if (posData) {
            setMarkerData(id, posData, onlyPositionUpdate);
            if (onlyPositionUpdate) return; // Nur gespeichert, kein Panel öffnen
        }
        
        // Marker-Daten abrufen oder initialisieren
        const markerData = getMarkerData(id);
        
        // 1. Konfigurations-Panel anzeigen und Titel setzen
        configPanel.style.display = 'block';
        document.getElementById('config-panel-title').textContent = `Lager ${id} konfigurieren`;

        // 2. UI-Elemente mit gespeicherten Werten befüllen
        
        // TODO: UI-Befüllung und Listener-Logik hier hinzufügen.
        // Die General- und Unit-Inputs müssen hier befüllt werden.

        // Beispiel: Befüllung der General-Select-Box (muss im HTML vorhanden sein)
        await populateGeneralSelector('config-general-select');
        
        // ... (Restliche Konfigurationslogik) ...
    };

    /**
     * Befüllt ein General-Dropdown-Element dynamisch. (Angepasst für den Placeholder)
     */
    async function populateGeneralSelector(selectorId) {
        const generalSelector = document.getElementById(selectorId);
        if (!generalSelector) return; 

        const generals = await loadGenerals();
        generalSelector.innerHTML = '<option value="">General wählen</option>'; 
        
        generals.forEach(general => {
            const option = document.createElement('option');
            // Verwendet den General-Namen als eindeutigen Wert
            option.value = general.name; 
            option.textContent = general.name;
            // Datenattribut für Bild hinzufügen (wird später für die Anzeige genutzt)
            const imgSrc = general.general_img && general.general_img.endsWith('.png') ? general.general_img : GENERAL_PLACEHOLDER_IMG;
            option.dataset.imgSrc = imgSrc;
            
            generalSelector.appendChild(option);
        });
        
        // Selektiert den gespeicherten Wert
        const marker = getMarkerData(currentMarkerId);
        if (marker && marker.config.generalName) {
            generalSelector.value = marker.config.generalName;
            // Trigger Change, um das General-Bild zu aktualisieren (falls es ein Listener gibt)
        }
    }

    /**
     * Erstellt Eingabefelder für Einheiten basierend auf dem ausgewählten Typ.
     * (Wird von der config-Logik aufgerufen)
     */
    async function populateUnitInputs(type) {
        const unitsContainer = document.getElementById('config-units-container');
        if (!unitsContainer) return; 

        unitsContainer.innerHTML = ''; 
        const units = await loadUnits();
        const filteredUnits = units.filter(unit => unit.type === type); 
        
        // Lade die gespeicherten Einheiten für diesen Marker
        const marker = getMarkerData(currentMarkerId);
        const storedUnits = marker ? marker.config.units : [];

        filteredUnits.forEach(unit => {
            const unitDiv = document.createElement('div');
            unitDiv.className = 'unit-input-group';
            
            // Suche den gespeicherten Wert
            const storedAmount = storedUnits.find(u => u.name === unit.name)?.amount || 0;

            unitDiv.innerHTML = `
                <img src="${unit.unit_img}" alt="${unit.name}" style="width: 30px; height: 30px;">
                <input type="number" 
                       name="unit_${unit.short_name || unit.name}" 
                       placeholder="Anzahl ${unit.short_name || unit.name}" 
                       step="1" min="0" max="200" 
                       value="${storedAmount}">
            `;
            unitsContainer.appendChild(unitDiv);
        });
        
        // Da die Inputs neu erstellt werden, müssen die Event-Listener für Speicherung
        // am übergeordneten configPanel definiert sein (Delegate).
    }
    
    // ... (populateMapSelector, showAdventureDetails bleiben erhalten) ...

    // ====================================================================
    // --- INITIALISIERUNG
    // ====================================================================

    // 1. Laden des gespeicherten Zustands und Wiederherstellung der visuellen Marker
    loadEditorState();

    // 2. Füllen der UI (Map-Selector)
    await populateMapSelector();
    
    // 3. Markieren der globalen Funktionen für marker.js
    window.openMarkerConfig = window.openMarkerConfig;
    window.removeMarkerData = window.removeMarkerData;
    window.setMarkerIdCounter = function(id) { markerId = id; }; // Funktion zum Zurücksetzen des Zählers im Marker-Skript
    
    // 4. Autosave-Listener
    window.addEventListener('beforeunload', saveEditorState);
    
    // TODO: Event-Listener für das Config-Panel zur Speicherung der Daten
});

// ... (Restliche Funktionen aus der usprünglichen main.js, wie populateMapSelector, showAdventureDetails, sind hier)
