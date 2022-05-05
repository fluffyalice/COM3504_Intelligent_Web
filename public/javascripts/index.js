let name = null;
let roomNo = null;
let socket = null;
let selectedStory = null;
let isOnline;
let isdrawMode = true;
const service_url = 'https://kgsearch.googleapis.com/v1/entities:search';
const apiKey = 'AIzaSyAG7w627q-djB4gTTahssufwNOImRqdYKM';
// let chat = io.connect('/chat');

var saveStoryModal = new bootstrap.Modal(document.getElementById('newStory'), {
    keyboard: false
})
var joinRoomModal = new bootstrap.Modal(document.getElementById('joinRoom'), {
    keyboard: false
})
/**
 * called by <body onload>
 * it initialises the interface and the expected socket messages
 * plus the associated actions
 */
async function init() {
    // it sets up the interface so that userId and room are selected
    // document.getElementById('initial_form').style.display = 'none';
    // document.getElementById('chat_interface').style.display = 'none';
    // //check for support
    if ('indexedDB' in window) {
        initDatabase();
    }
    else {
        console.log('This browser doesn\'t support IndexedDB');
    }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then(function() { console.log('Service Worker Registered'); });
    }

    //@todo here is where you should initialise the socket operations as described in teh lectures (room joining, chat message receipt etc.)
    socket = io.connect('/app');
    initChatSocket();
    widgetInit()
    // get and diaply the stories from the server if online
    // otherwise get from the indexedDB
    loadStoryData(true);
    // get all visted room from the indexedDB
    renderVistedRoom();
    trySaveCachedData();

}

/**
 * called when app is online or initialised
 * get the stories from the indexedDB
 * and send them to the server if is not saved on the server side
 */
async function trySaveCachedData() {
    let data = await getAllCachedData()
    // await deleteCachedData(1650038772167)
    for (let story of data) {
        if (story.saved == 0) {
            sendAjaxQuery('/api/stories', story, async (data) => {
                addToResults(data)
                await storeCachedData('story', { ...data, saved: 1 })
                await deleteCachedData(story._id)
            })
        }
    }
}

/**
 * it initialises the socket for /chat
 */
function initChatSocket() {
    // called when someone joins the room. If it is someone else it notifies the joining of the room
    socket.on('joined', function(room, userId) {
        if (userId === name) {
            // it enters the chat
            hideHomeInterface(room, userId);
        } else {
            // notifies that someone has joined the room
            writeOnHistory('<b>' + userId + '</b>' + ' joined room ' + (room.split('-')[1]));
        }
    });
    // called when a message is received
    socket.on('chat', function(room, userId, chatText) {
        let who = userId
        if (userId === name) who = 'Me';
        writeOnHistory('<b>' + who + ':</b> ' + chatText);
    });

}

/**
 * show the story creation form to create a new story
 */
function showNewStoryModal() {
    saveStoryModal.show();
}

/**
 * show the join form to join a room
 * it ask user to enter a room number and username
 * @param {string} id the id of the story to join
 */
function showJoinRoomModal(id) {
    selectedStory = id;
    joinRoomModal.show();
}

/**
 * search for stories that matches the search term
 * then update the ui with the results
 */
async function searchStories() {
    let key = document.getElementById('searchkeyword').value;

    // clear the stories list
    document.getElementById('stories').innerHTML = '';
    let stories = await getAllCachedData();
    stories = stories.filter(story => {
        return story.title.toLowerCase().includes(key.toLowerCase())
    })
    if (document.getElementById('orderByDateDesc').checked) {
        stories = stories.sort((a, b) => {
            return new Date(b.date) - new Date(a.date)
        })
    } else if (document.getElementById('orderByDateAsc').checked) {
        stories = stories.sort((a, b) => {
            return new Date(a.date) - new Date(b.date)
        })
    }
    else if (document.getElementById('orderByAuthorAsc').checked) {
        stories = stories.sort((a, b) => {
            return a.author.localeCompare(b.author)
        })
    } else if (document.getElementById('orderByAuthorDesc').checked) {
        stories = stories.sort((a, b) => {
            return b.author.localeCompare(a.author)
        })
    }
    for (let story of stories) {
        addToResults(story)
    }
}

/**
 * save the story to backend if its online
 * otherwise save it to indexedDB
 */
function saveStories() {
    let image = $('#upload').attr('src')
    let title = $('#title').val()
    let description = $('#description').val()
    let author = $('#author').val()
    let date = $('#date').val()
    // if any of the fields are empty then return
    if (!image || !title || !description || !author || !date) {
        alert('Please fill all the fields')
        return
    }
    let story = {
        image,
        title,
        description,
        author,
        date
    }
    sendAjaxQuery('/api/stories', story, (data) => {
        // hide the modal
        saveStoryModal.hide()
        // add the data to ui
        addToResults(data)
        // save the new story in the cache
        storeCachedData('story', { ...data, saved: 1 })
    }, (err) => {
        console.log(err)
        saveStoryModal.hide()
        addToResults(story)
        storeCachedData('story', { ...story, _id: (new Date()).getTime(), saved: 0 })
    })
}

/**
 * called to generate a random room number
 * This is a simplification. A real world implementation would ask the server to generate a unique room number
 * so to make sure that the room number is not accidentally repeated across uses
 */
function generateRoom() {
    roomNo = Math.round(Math.random() * 10000);
    document.getElementById('roomNo').value = 'R' + roomNo;
}

/**
 * called when the Send button is pressed. It gets the text to send from the interface
 * and sends the message via  socket
 */
function sendChatText() {
    let chatText = document.getElementById('chat_input').value;
    // @todo send the chat message
    console.log('send mesage ' + roomNo + '  with name' + name + ' ' + chatText)
    socket.emit('chat', roomNo, name, chatText);
}

/**
 * used to connect to a room. It gets the user name and room number from the
 * interface
 */
async function connectToRoom() {

    let story = await getCachedData(selectedStory)
    if (!story) return
    joinRoomModal.hide()
    roomNo = document.getElementById('roomNo').value;
    name = document.getElementById('name').value;
    let imageUrl = story.image
    roomNo = selectedStory + '-' + roomNo
    if (!name) name = 'Unknown-' + Math.random();
    //@todo join the room
    socket.emit('create or join', roomNo, name);
    await saveVistedHistory({
        id: roomNo,
        room: document.getElementById('roomNo').value,
        story,
        username: name
    })
    // update story detail in chat room
    document.getElementById('story-title').textContent = story.title;
    document.getElementById('story-author').textContent = story.author;
    document.getElementById('story-description').textContent = story.description;
    await renderKnowledgeGraph()
    initCanvas(socket, imageUrl);
    hideHomeInterface(roomNo, name);
}

/**
 * it appends the given html text to the history div
 * this is to be called when the socket receives the chat message (socket.on ('message'...)
 * @param text: the text to append
 */
function writeOnHistory(text) {
    if (text === '') return;
    let history = document.getElementById('history');
    let paragraph = document.createElement('p');
    paragraph.innerHTML = text;
    history.appendChild(paragraph);
    // scroll to the last element
    history.scrollTop = history.scrollHeight;
    document.getElementById('chat_input').value = '';
}

/**
 * it hides the home and shows the chat
 * @param room the selected room
 * @param userId the user name
 */
function hideHomeInterface(room, userId) {
    // document.getElementById('initial_form').style.display = 'none';
    // document.getElementById('chat_interface').style.display = 'block';
    document.getElementById('who_you_are').innerHTML = userId;
    document.getElementById('in_room').innerHTML = ' ' + room.split('-')[1];
    changePage('chat_interface')
}

/**
 * it sends an Ajax query using JQuery
 * @param url the url to send to
 * @param data the data to send (e.g. a Javascript structure)
 */
function sendAjaxQuery(url, data, success, error) {
    $.ajax({
        url: url,
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'json',
        type: 'POST',
        success,
        error
    });
}

/**
 * loads the story data from the server if online mode
 * otherwise it loads the data from the cache
 * @param {*} forceReload 
 */
async function loadStoryData(forceReload) {
    if (forceReload) {
        $.ajax({
            url: '/api/stories',
            contentType: 'application/json',
            dataType: 'json',
            type: 'GET',
            success: (dataR) => {
                // console.log(dataR)
                for (let item of dataR) {
                    storeCachedData('story', { ...item, saved: 1 })
                    addToResults(item)
                }
            },
            error: () => {
                getAllCachedData().then(stories => {
                    // console.log(data)
                    for (let story of stories) {
                        addToResults(story)
                    }
                })
            }
        });
    }
}


/**
 * When the client gets off-line, it shows an off line warning to the user
 * so that it is clear that the data is stale
 */
window.addEventListener('offline', function(e) {
    // Queue up events for server.
    console.log("You are offline");
    showOfflineWarning();
}, false);

/**
 * When the client gets online, it hides the off line warning
 */
window.addEventListener('online', function(e) {
    // Resync data with server.
    console.log("You are online");
    hideOfflineWarning();
    loadData(false);
    trySaveCachedData();
}, false);


function showOfflineWarning() {
    if (document.getElementById('offline_div') != null)
        document.getElementById('offline_div').style.display = 'block';
}

function hideOfflineWarning() {
    if (document.getElementById('offline_div') != null)
        document.getElementById('offline_div').style.display = 'none';
}

///////////////////////// INTERFACE MANAGEMENT ////////////


/**
 * given the forecast data returned by the server,
 * it adds a row of weather forecasts to the results div
 * @param dataR the data returned by the server:
 * class Story{
  *  constructor (title, text, photo, date) {
  *    this.title= title;
  *    this.text= text,
  *    this.photo=photo;
  *    this.date= date;
  *  }
  *}
 */
function addToResults(dataR) {
    if (document.getElementById('stories') != null) {
        const col = document.createElement('div');
        // appending a new row
        document.getElementById('stories').appendChild(col);
        // formatting the row by applying css classes
        col.classList.add('col-lg-3');
        col.classList.add('mb-2');
        // the following is far from ideal. we should really create divs using javascript
        // rather than assigning innerHTML
        col.innerHTML = `<div class="card">
            <img src="${dataR.image}" class="card-img-top cover" alt="...">
            <div class="card-body">
                <h5 class="card-title">${dataR.title}</h5>
                <span class="card-text text-muted">Author: ${dataR.author}</span>
                <br/>
                <span class="card-text text-muted">${new Date(dataR.date).toLocaleDateString()}</span>
                <p class="card-text ellipsis">${dataR.description}</p>
               
                <button onclick="showJoinRoomModal('${dataR._id}')" class="btn btn-primary">Join</button>
            </div>
        </div>`;
    }
}

/**
 * convert the image url to a base64 string
 */
function toDataURL() {
    const url = $('#imageurl').val()
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        var reader = new FileReader();
        reader.onloadend = function() {
            $('#upload').attr('src', reader.result)
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
}

/**
 * convert the input file to a base64 string
 * @param {*} element 
 */
function encodeImageFileAsURL(element) {

    var file = element.files[0];
    var reader = new FileReader();
    reader.onloadend = function() {
        $('#upload').attr('src', reader.result)
    }
    reader.readAsDataURL(file);

}



/**
 * it inits the widget by selecting the type from the field myType
 * and it displays the Google Graph widget
 * it also hides the form to get the type
 */
function widgetInit() {
    let type = document.getElementById("myType").value || 'all';
    let config = {
        'limit': 10,
        'languages': ['en'],
        'types': [type],
        'maxDescChars': 100,
        'selectHandler': selectItem,
    }
    KGSearchWidget(apiKey, document.getElementById("myInput"), config);
}

/**
 * callback called when an element in the widget is selected
 * @param event the Google Graph widget event {@link https://developers.google.com/knowledge-graph/how-tos/search-widget}
 */
function selectItem(event) {
    let row = event.row;
    let graph = { ...row, room: roomNo, color: '#000000' }
    storeKnowledgeGraph(graph)
    appendAnnotation(graph)
}

// function to add a new annotation to the knowledge graph list
function appendAnnotation(row) {

    $('#annotations').append(`
    <div class='col-md-4 mt-1' >
        <div id="${row.id}" class="resultPanel h-100 m-1" style="border:3px solid ${row.color}">
        <h3 >${row.name}</h3>
        <div >${row.rc}</div>
        <a href="${row.qc}" class="mt-3" target="_blank">
            Link to Webpage
        </a>
        <div class="mt-auto mt-3">
            <div class="input-group input-group-sm  w-100 mt-3">
             <div id="${row.id}" class="input-group-text" >Annotation</div>
             <input id="${row.id}" type="color" onchange="linkAnnotation(event,'${row.id}')"" class="form-control form-control-color" value="${row.color}" title="Annotation">
            </div>
            <button class="btn btn-sm btn-danger w-100 mt-3" onclick="removeKG('${row.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
            </button>
        </div>
        </div>
    </div>`)
}

/**
 * link an annotation to a knowledge graph by choosing a color
 * @param {*} e the event
 * @param {*} id the id of the knowledge graph
 */
async function linkAnnotation(e, id) {
    color = e.target.value || 'red';
    document.getElementById(id).style.border = '3px solid ' + color;
    let kg = await getKnowledgeGraphById(id)
    kg.color = color;
    storeKnowledgeGraph(kg)
}

/**
 * function to remove a knowledge graph from the indexedDB
 * and rerender the list
 * */
async function removeKG(id) {
    await deleteKnowledgeGraphById(id)
    await renderKnowledgeGraph()
}

/**
 * function to render the list of knowledge graph
 */
async function renderKnowledgeGraph() {
    document.getElementById('annotations').innerHTML = '';
    let data = await getKnowledgeGraph(roomNo)
    for (let i = 0; i < data.length; i++) {
        appendAnnotation(data[i])
    }
}

/**
 * render all visited rooms as a list
 * all visited rooms are stored in the indexedDB
 */
async function renderVistedRoom() {
    let rooms = await getAllVistedHistoryData()
    let histories = document.getElementById('histories')
    let htmlStr = rooms.map(room => {
        return `
       <li class="list-group-item">
       <div class="card">
           <div class="card-header">
               ${room.room}
           </div>
           <div class="card-body">
               <h5 class="card-title"> ${room.story.title}</h5>
               <p class="card-text text-muted ellipsis">${room.story.description}</p>
               <button onclick="reJoin('${room.id}','${room.username}')" class="btn btn-primary btn-sm">Join</button>
           </div>
       </div>
   </li>`
    }).join('');

    histories.innerHTML = htmlStr
}

/**
 * rejoin the room the user has visited
 * @param {*} id the id of the composit of story id and room
 * @param {*} username the username of the user when he joined the room
 */
async function reJoin(id, username) {
    let [storyId, room] = id.split('-')
    let story = await getCachedData(storyId)
    if (!story) return
    joinRoomModal.hide()
    roomNo = room;
    name = username;
    let imageUrl = story.image
    roomNo = id
    if (!name) name = 'Unknown-' + Math.random();
    //@todo join the room
    socket.emit('create or join', roomNo, name);

    // update story detail in chat room
    document.getElementById('story-title').textContent = story.title;
    document.getElementById('story-author').textContent = story.author;
    document.getElementById('story-description').textContent = story.description;
    await renderKnowledgeGraph()
    // init the image
    initCanvas(socket, imageUrl);

    hideHomeInterface(roomNo, name);
}

/**
 * change the page
 * @param {*} id the id of the target page
 */
function changePage(id) {
    // clearn the stories div
    document.getElementById('history').innerHTML = ''
    document.getElementById('image').classList.remove('hidden');
    document.getElementById('chat_interface').classList.add('hidden');
    // document.getElementById('initial_form').classList.add('hidden');
    document.getElementById('home').classList.add('hidden');
    if (id === 'home') {
        renderVistedRoom()
        document.getElementById('annotations').innerHTML = ''
    }

    document.getElementById(id).classList.remove('hidden');
}

/**
 * Change the drawing mode
 * if mode is false then the user can erase lines
 * otherwise the user can draw lines
 * @param {*} mode the boolean value of the mode
 */
function drawMode(mode) {
    isdrawMode = mode;
}



