let name = null;
let roomNo = null;
let socket = null;
let selectedStory = null;
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
function init() {
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
    // getCachedData('6238f61f18cbf8e9ec89f5d0')
    //     .then(data => console.log(data))

    loadStoryData(true);

}

/**
 * it initialises the socket for /chat
 */

function initChatSocket() {
    // called when someone joins the room. If it is someone else it notifies the joining of the room
    socket.on('joined', function(room, userId) {
        console.log(room, userId)
        if (userId === name) {
            // it enters the chat
            hideLoginInterface(room, userId);
        } else {
            // notifies that someone has joined the room
            writeOnHistory('<b>' + userId + '</b>' + ' joined room ' + room);
        }
    });
    // called when a message is received
    socket.on('chat', function(room, userId, chatText) {
        let who = userId
        if (userId === name) who = 'Me';
        writeOnHistory('<b>' + who + ':</b> ' + chatText);
    });

}

function showNewStoryModal() {
    saveStoryModal.show();
}

function showJoinRoomModal(id) {
    selectedStory = id;
    joinRoomModal.show();
}
/**
 * 
 */
function saveStories() {
    let image = $('#upload').attr('src')
    let title = $('#title').val()
    let description = $('#description').val()
    let author = $('#author').val()
    let date = $('#date').val()
    sendAjaxQuery('/api/stories', {
        image,
        title,
        description,
        author,
        date
    }, (data) => {
        // hide the modal
        saveStoryModal.hide()
        // add the data to ui
        addToResults(data)
        // save the new story in the cache
        storeCachedData('story', { ...data, saved: 1 })
    }, (err) => {
        console.log(err)
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

    // update story detail in chat room
    document.getElementById('story-title').textContent = story.title;
    document.getElementById('story-author').textContent = story.author;
    document.getElementById('story-description').textContent = story.description;

    initCanvas(socket, imageUrl);
    hideLoginInterface(roomNo, name);
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
 * it hides the initial form and shows the chat
 * @param room the selected room
 * @param userId the user name
 */
function hideLoginInterface(room, userId) {
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
            <img src="${dataR.image}" class="card-img-top" alt="...">
            <div class="card-body">
                <h5 class="card-title">${dataR.title}</h5>
                <p class="card-text">${dataR.description}</p>
                <button onclick="showJoinRoomModal('${dataR._id}')" class="btn btn-primary">Join</button>
            </div>
        </div>`;
    }
}


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
    let type = document.getElementById("myType").value;
    if (type) {
        let config = {
            'limit': 10,
            'languages': ['en'],
            'types': [type],
            'maxDescChars': 100,
            'selectHandler': selectItem,
        }
        KGSearchWidget(apiKey, document.getElementById("myInput"), config);

    }
}

/**
 * callback called when an element in the widget is selected
 * @param event the Google Graph widget event {@link https://developers.google.com/knowledge-graph/how-tos/search-widget}
 */
function selectItem(event) {
    let row = event.row;
    $('#annotations').append(`
    <div class='col-md-4' >
        <div class="resultPanel h-100 m-1">
        <h3 id="resultName">${row.name}</h3>
        <h4 id="resultId">${row.id}</h4>
        <div id="resultDescription">${row.rc}</div>
        <div>
            <a id="resultUrl" href="${row.qc}" target="_blank">
                Link to Webpage
            </a>
        </div>
        </div>
    </div>`)

}

/**
 * currently not used. left for reference
 * @param id
 * @param type
 */
function queryMainEntity(id, type) {
    const params = {
        'query': mainEntityName,
        'types': type,
        'limit': 10,
        'indent': true,
        'key': apiKey,
    };
    $.getJSON(service_url + '?callback=?', params, function(response) {
        $.each(response.itemListElement, function(i, element) {

            $('<div>', { text: element['result']['name'] }).appendTo(document.body);
        });
    });
}


function changePage(id) {
    // clearn the stories div
    document.getElementById('history').innerHTML = ''
    document.getElementById('image').classList.remove('hidden');
    document.getElementById('chat_interface').classList.add('hidden');
    // document.getElementById('initial_form').classList.add('hidden');
    document.getElementById('home').classList.add('hidden');
    // set the image visible for canvas render

    // document.getElementById('image').src = ""

    document.getElementById(id).classList.remove('hidden');
}



