////////////////// DATABASE //////////////////
// the database receives from the server the following structure
import * as idb from './idb/index.js';


/** class WeatherForecast{
 *  constructor (title, date, forecast, temperature, wind, precipitations) {
 *    this.title= title;
 *    this.date= date,
 *    this.forecast=forecast;
 *    this.temperature= temperature;
 *    this.wind= wind;
 *    this.precipitations= precipitations;
 *  }
 *}
 */
let db;

const DB_NAME = 'app_db';
const STORE_NAME = 'story';
const ANNOTATION = 'annotation'

/**
 * it inits the database
 */
async function initDatabase() {
    if (!db) {
        db = await idb.openDB(DB_NAME, 2, {
            upgrade(upgradeDb, oldVersion, newVersion) {
                if (!upgradeDb.objectStoreNames.contains(STORE_NAME)) {
                    let forecastDB = upgradeDb.createObjectStore(STORE_NAME, {
                        keyPath: '_id',
                    });
                    forecastDB.createIndex('saved', 'saved', { unique: false, multiEntry: true });
                }
                if (!upgradeDb.objectStoreNames.contains(ANNOTATION)) {
                    let forecastDB = upgradeDb.createObjectStore(ANNOTATION, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    forecastDB.createIndex('_id', '_id', { unique: false, multiEntry: true });
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
            console.log('added item to the store! ' + JSON.stringify(storyObject));
        } catch (error) {
            localStorage.setItem(id, JSON.stringify(storyObject));
        };
    }
    else localStorage.setItem(id, JSON.stringify(storyObject));
}

window.storeCachedData = storeCachedData;


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
async function storeAnnotationData(id, annotationObject) {
    if (!db)
        await initDatabase();
    if (db) {
        try {
            let tx = await db.transaction(ANNOTATION, 'readwrite');
            let store = await tx.objectStore(ANNOTATION);
            await store.put(annotationObject);
            await tx.complete;
        } catch (error) {
            console.log(error)
            localStorage.setItem(id, JSON.stringify(annotationObject));
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



