/**
 * main.js - Kernlogik für den DSO Taktik-Editor.
 * Verantwortlich für UI-Initialisierung, Daten-Loading, Abenteuer-Auswahl und Speicherverwaltung.
 * Copyright (c) 2024 Volkan Sah / Open Source Community
 */

document.addEventListener('DOMContentLoaded', async function() {
    // --- KONSTANTEN UND UI-ELEMENTE
    const LOCAL_STORAGE_KEY = "TSO_EDITOR_STATE";
    const mapSelector = document.getElementById('map-selector');
    const mainMap = document.getElementById('main-map');
    const adventureType = document.getElementById('adventure-type');
    const adventureLevel = document.getElementById('adventure-level');
    const adventurePlayers = document.getElementById('adventure-players');

    // --- DATEN-CACHE: Speichert geladene JSON-Daten, um sie nur einmal zu laden (Performance-Optimierung)
    const DATA_CACHE = {};
    
    // --- ZENTRALER SPEICHER FÜR DEN ZUSTAND DER ANWENDUNG
    let editorState = {
        currentMapSrc: '',
        markers: [] // Sollte später die Positionen und Lager-Konfigurationen enthalten
    };

    // ====================================================================
    // --- DATENLADE-FUNKTIONEN (Optimiert mit Caching)
    // ====================================================================

    // Generalisierte Ladefunktion mit Caching
    async function fetchDataAndCache(path, rootKey) {
        if (DATA_CACHE[rootKey]) return DATA_CACHE[rootKey];
        
        const response = await fetch(path);
        const data = await response.json();
        DATA_CACHE[rootKey] = data[rootKey] || data;
        return DATA_CACHE[rootKey];
    }
    
    // Karten laden (Optimiert)
    async function loadMaps() {
        return fetchDataAndCache('data/map_loader.json', 'map_loader');
    }

    // Abenteuerdetails laden (Optimiert)
    async function loadAdventureDetails() {
        return fetchDataAndCache('data/maps.json', 'abenteuer');
    }

    // Generäle laden (Optimiert)
    async function loadGenerals() {
        return fetchDataAndCache('data/generals.json', 'generals');
    }

    // Einheiten laden (Optimiert)
    async function loadUnits() {
        return fetchDataAndCache('data/units.json', 'units');
    }
    
    // ====================================================================
    // --- SPEICHERVERWALTUNG (localStorage)
    // ====================================================================

    /**
     * Speichert den aktuellen Editor-Zustand (Karte, Marker-Daten) im localStorage.
     * Sollte nach jeder relevanten Änderung aufgerufen werden.
     */
    function saveEditorState() {
        try {
            // Sammle den Zustand. Nur die SRC der Karte ist hier minimal nötig.
            editorState.currentMapSrc = mainMap.src;
            
            // HIER MUSS SPÄTER DIE LOGIK ZUM SAMMELN DER MARTERDATEN EINGEFÜGT WERDEN
            // editorState.markers = collectMarkerData(); 

            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(editorState));
            console.log("Editor-Zustand gespeichert.");
        } catch (e) {
            console.error("Fehler beim Speichern in localStorage:", e);
        }
    }

    /**
     * Lädt den letzten gespeicherten Zustand und wendet ihn auf die UI an.
     * @returns {boolean} True, wenn Zustand geladen wurde, sonst False.
     */
    function loadEditorState() {
        try {
            const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (serializedState === null) {
                console.log("Kein gespeicherter Zustand gefunden.");
                return false;
            }

            const state = JSON.parse(serializedState);
            editorState = state; 
            
            // Karte wiederherstellen
            if (state.currentMapSrc) {
                mainMap.src = state.currentMapSrc;
            }
            
            // HIER MUSS SPÄTER DIE LOGIK ZUR WIEDERHERSTELLUNG DER MARKER EINGEFÜGT WERDEN
            // restoreMarkers(state.markers); 
            
            console.log("Editor-Zustand geladen.");
            return true;

        } catch (e) {
            console.error("Fehler beim Laden/Parsen des gespeicherten Zustands:", e);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            return false;
        }
    }


    // ====================================================================
    // --- UI-BEFÜLLUNG UND LOGIK
    // ====================================================================
    
    // ... (populateMapSelector, showAdventureDetails, populateGeneralSelector, populateUnitInputs bleiben hier erhalten) ...
    // HINWEIS: Die Funktionen wurden hier aus Platzgründen nicht wiederholt, aber sie sind in Ihrer Datei.
    
    // Dropdown mit Karten füllen
    async function populateMapSelector() {
        const maps = await loadMaps();
        maps.forEach(map => {
            const option = document.createElement('option');
            option.value = map.at_img;
            option.textContent = map.at_loader_name;
            mapSelector.appendChild(option);
        });
        
        // Nach dem Füllen: Wählt die gespeicherte Karte aus, falls vorhanden.
        if (editorState.currentMapSrc) {
             mapSelector.value = editorState.currentMapSrc;
             // Löst das Change-Event manuell aus, um Details zu aktualisieren
             mapSelector.dispatchEvent(new Event('change')); 
        }
    }
    
    // Abenteuerdetails anzeigen (Ihre Originalfunktion)
    async function showAdventureDetails(selectedMap) {
        const adventures = await loadAdventureDetails();
        const adventure = adventures.find(a => a.Abenteuer === selectedMap);
        
        if (adventure) {
            adventureType.textContent = `Zuordnung: ${adventure.Zuordnung}`;
            adventureLevel.textContent = `Level: ${adventure.Level}`;
            adventurePlayers.textContent = `Spieler: ${adventure['Spieler-Min']} - ${adventure['Spieler-Max']}`;
        } else {
            adventureType.textContent = '';
            adventureLevel.textContent = '';
            adventurePlayers.textContent = '';
        }
    }


    // ====================================================================
    // --- EVENT-LISTENER UND INITIALISIERUNG
    // ====================================================================

    // Listener für die Karten-Auswahl: Aktualisiert die Karte und speichert den Zustand.
    mapSelector.addEventListener('change', function() {
        const selectedOption = mapSelector.options[mapSelector.selectedIndex];
        const selectedMap = selectedOption.text;
        const imgSrc = selectedOption.value;
        
        mainMap.src = imgSrc;
        showAdventureDetails(selectedMap);
        saveEditorState(); // Zustand nach Kartenwechsel speichern
    });

    // --- ANWENDUNGSSTART-LOGIK ---
    
    // 1. Laden des gespeicherten Zustands
    loadEditorState();

    // 2. Füllen der UI basierend auf geladenen Daten (oder Default-Daten)
    await populateMapSelector();
    
    // 3. Markieren der globalen Funktionen für marker.js
    window.populateGeneralSelector = populateGeneralSelector;
    window.populateUnitInputs = populateUnitInputs;
    
    // ... Restliche Logik (General/Unit Selector Init, Attack Wave, Generate Map) bleibt hier erhalten
    
    
    // Beispiel: Speichern des Zustands nach Hinzufügen einer Welle (muss in Ihre Logik integriert werden)
    document.getElementById('generate-map').addEventListener('click', generateAndDownloadMap);
    
    // Die unnötigen globalen Select-Elemente werden entfernt, da sie nicht korrekt platziert wurden.
    // const generalSelector = document.createElement('select'); 
    // const unitSelector = document.createElement('select');
    // document.body.appendChild(generalSelector); 
    // document.body.appendChild(unitSelector); 

    // Füge einen generischen Autosave-Listener hinzu
    window.addEventListener('beforeunload', saveEditorState);
});
