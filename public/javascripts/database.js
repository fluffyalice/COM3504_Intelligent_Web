////////////////// DATABASE //////////////////
// the database receives from the server the following structure
import * as idb from './idb/index.js';


/** 
 */
let db;

const DB_NAME = 'app_db';
const STORE_NAME = 'story';
const ANNOTATION = 'annotation'
const ROOM_HISOTRY = 'room_history';
const KNOWLEDGE_GRAPH = 'knowledge_graph';
/**
 * it inits the database
 */
async function initDatabase() {
    if (!db) {
        db = await idb.openDB(DB_NAME, 2, {
            upgrade(upgradeDb, oldVersion, newVersion) {
                if (!upgradeDb.objectStoreNames.contains(STORE_NAME)) {
                    let appDB = upgradeDb.createObjectStore(STORE_NAME, {
                        keyPath: '_id',
                    });
                    appDB.createIndex('saved', 'saved', { unique: false, multiEntry: true });
                }
                if (!upgradeDb.objectStoreNames.contains(ANNOTATION)) {
                    let appDB = upgradeDb.createObjectStore(ANNOTATION, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    appDB.createIndex('_id', '_id', { unique: false, multiEntry: true });
                }
                if (!upgradeDb.objectStoreNames.contains(KNOWLEDGE_GRAPH)) {
                    let appDB = upgradeDb.createObjectStore(KNOWLEDGE_GRAPH, {
                        keyPath: 'id',
                    });
                    appDB.createIndex('room', 'room', { unique: false, multiEntry: true });
                }
                if (!upgradeDb.objectStoreNames.contains(ROOM_HISOTRY)) {
                    let appDB = upgradeDb.createObjectStore(ROOM_HISOTRY, {
                        keyPath: 'id',
                    });
                    appDB.createIndex('room', 'room', { unique: false, multiEntry: true });
                }
            }
        });

        console.log('db created');
    }
}
window.initDatabase = initDatabase;

/**
 * it saves the story for a title in localStorage
 * @param id
 * @param storyObject
 */
async function storeCachedData(id, storyObject) {
    console.log('inserting: ' + JSON.stringify(storyObject));
    if (!db)
        await initDatabase();
    if (db) {
        try {
            let tx = await db.transaction(STORE_NAME, 'readwrite');
            let store = await tx.objectStore(STORE_NAME);
            await store.put(storyObject);
            await tx.complete;
            console.log('added item to the store! ' + storyObject._id);
        } catch (error) {
            localStorage.setItem(id, JSON.stringify(storyObject));
        };
    }
    else localStorage.setItem(id, JSON.stringify(storyObject));
}

window.storeCachedData = storeCachedData;


async function deleteCachedData(id) {

    if (!db)
        await initDatabase();
    if (db) {
        try {
            let tx = await db.transaction(STORE_NAME, 'readwrite');
            let store = await tx.objectStore(STORE_NAME);
            let kg = store.delete(id)
            await tx.complete;
            return kg;
        } catch (error) {
            console.log(error);
        }
    } else {

    }
}
window.deleteCachedData = deleteCachedData;


/**
 * it retrieves the story data for a title from the database
 * @param id
 * @returns {*}
 */
async function getCachedData(id) {
    if (!db)
        await initDatabase();
    if (db) {
        try {
            console.log('fetching: ' + id);
            let tx = await db.transaction(STORE_NAME, 'readonly');
            let store = await tx.objectStore(STORE_NAME);
            // let index = await store.index('_id');
            let readingsList = await store.get(id);
            await tx.complete;
            return readingsList;
        } catch (error) {
            console.log(error);
        }
    } else {
        let arr = localStorage.getItem("story");
        let finalResults = [];

        if (arr == null)
            return finalResults;
        arr = JSON.parse('arr');
        for (let s of arr) {
            if (s.title === title)
                finalResults.push(value);
        }

        return finalResults;
    }
}
window.getCachedData = getCachedData;


/**
 * it retrieves the all story data from the database
 * @returns {*}
 */
async function getAllCachedData() {
    if (!db)
        await initDatabase();
    if (db) {
        try {
            console.log('fetching: ' + title);
            let tx = await db.transaction(STORE_NAME, 'readonly');
            let store = await tx.objectStore(STORE_NAME);
            let readingsList = await store.getAll();
            await tx.complete;
            return readingsList;
        } catch (error) {
            console.log(error);
        }
    } else {
        const arr = localStorage.getItem('story');
        let finalResults = [];
        if (arr == null)
            return finalResults;
        else {
            finalResults = JSON.parse(arr)
            return finalResults;
        }

    }
}
window.getAllCachedData = getAllCachedData;


/**
 * it saves the Annotation to indexedb
 * @param id
 * @param annotationObject
 */
async function storeAnnotationData(id, buffer) {
    if (!db)
        await initDatabase();
    if (db) {
        try {
            let tx = await db.transaction(ANNOTATION, 'readwrite');
            let store = await tx.objectStore(ANNOTATION);
            for (let i = 0; i < buffer.length; i++) {
                await store.put(buffer[i]);
            }
            await tx.complete;
        } catch (error) {
            console.log(error)
            // localStorage.setItem(id, JSON.stringify(annotationObject));
        };
    }
    else localStorage.setItem(id, JSON.stringify(annotationObject));
}

window.storeAnnotationData = storeAnnotationData;


/**
 * it retrieves the all Annotation data from the database with sepecific id
 * @returns {*}
 */
async function getAnnotationData(id) {
    if (!db)
        await initDatabase();
    if (db) {
        try {
            console.log('fetching: ' + id);
            let tx = await db.transaction(ANNOTATION, 'readonly');
            let store = await tx.objectStore(ANNOTATION);
            let index = store.index('_id')
            let readingsList = await index.getAll(IDBKeyRange.only(id));
            await tx.complete;
            return readingsList;
        } catch (error) {
            console.log(error);
        }
    } else {
        const arr = localStorage.getItem('story');
        let finalResults = [];
        if (arr == null)
            return finalResults;
        else {
            finalResults = JSON.parse(arr)
            return finalResults;
        }

    }
}
window.getAnnotationData = getAnnotationData;


async function saveVistedHistory(history) {
    if (!db)
        await initDatabase();
    if (db) {
        console.log('save history', history)
        try {
            let tx = await db.transaction(ROOM_HISOTRY, 'readwrite');
            let store = await tx.objectStore(ROOM_HISOTRY);
            await store.put(history);
            await tx.complete;
        } catch (error) {
            console.log(error);
        }
    }
    else localStorage.setItem(id, JSON.stringify(annotationObject));
}

window.saveVistedHistory = saveVistedHistory;

/**
 * it get the room history to indexedb
 */
async function getAllVistedHistoryData() {
    if (!db)
        await initDatabase();
    if (db) {
        try {
            let tx = await db.transaction(ROOM_HISOTRY, 'readonly');
            let store = await tx.objectStore(ROOM_HISOTRY);
            let readingsList = await store.getAll();
            await tx.complete;
            return readingsList;
        } catch (error) {
            console.log(error);
        }
    } else {


    }
}
window.getAllVistedHistoryData = getAllVistedHistoryData;

async function storeKnowledgeGraph(data) {
    if (!db)
        await initDatabase();
    if (db) {
        console.log('save knowledge graph', data)
        try {
            let tx = await db.transaction(KNOWLEDGE_GRAPH, 'readwrite');
            let store = await tx.objectStore(KNOWLEDGE_GRAPH);
            await store.put(data);
            await tx.complete;
        } catch (error) {
            console.log(error);
        }
    }

}

window.storeKnowledgeGraph = storeKnowledgeGraph;

async function getKnowledgeGraph(room) {
    if (!db)
        await initDatabase();
    if (db) {
        try {
            let tx = await db.transaction(KNOWLEDGE_GRAPH, 'readonly');
            let store = await tx.objectStore(KNOWLEDGE_GRAPH);

            let index = store.index('room')
            let readingsList = await index.getAll(IDBKeyRange.only(room));
            await tx.complete;
            return readingsList;
        } catch (error) {
            console.log(error);
        }
    } else {

    }
}
window.getKnowledgeGraph = getKnowledgeGraph;

async function getKnowledgeGraphById(id) {

    if (!db)
        await initDatabase();
    if (db) {
        try {
            let tx = await db.transaction(KNOWLEDGE_GRAPH, 'readonly');
            let store = await tx.objectStore(KNOWLEDGE_GRAPH);
            let kg = store.get(id)
            await tx.complete;
            return kg;
        } catch (error) {
            console.log(error);
        }
    } else {

    }
}
window.getKnowledgeGraphById = getKnowledgeGraphById;



async function deleteKnowledgeGraphById(id) {

    if (!db)
        await initDatabase();
    if (db) {
        try {
            let tx = await db.transaction(KNOWLEDGE_GRAPH, 'readwrite');
            let store = await tx.objectStore(KNOWLEDGE_GRAPH);
            let kg = store.delete(id)
            await tx.complete;
            return kg;
        } catch (error) {
            console.log(error);
        }
    } else {

    }
}
window.deleteKnowledgeGraphById = deleteKnowledgeGraphById;



