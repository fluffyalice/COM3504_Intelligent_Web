/**
 * this file contains the functions to control the drawing on the canvas
 */
let room;
let userId;
let color = 'red', thickness = 4;
// draw if isdrawMode is 1

/**
 * it inits the image canvas to draw on. It sets up the events to respond to (click, mouse on, etc.)
 * it is also the place where the data should be sent  via socket.io
 * @param sckt the open socket to register events on
 * @param imageUrl teh image url to download
 */
function initCanvas(sckt, imageUrl) {
    socket = sckt;
    let flag = false,
        prevX, prevY, currX, currY = 0;
    let canvas = $('#canvas');
    let cvx = document.getElementById('canvas');

    let img = document.getElementById('image');
    let ctx = cvx.getContext('2d');

    img.src = imageUrl;

    let buffer = []
    // event on the canvas when the mouse is on it
    canvas.on('mousemove mousedown mouseup mouseout', function(e) {
        prevX = currX;
        prevY = currY;
        currX = e.clientX - canvas.position().left;
        currY = e.clientY - canvas.position().top;
        if (e.type === 'mousedown') {
            flag = true;
        }
        if (e.type === 'mouseup' || e.type === 'mouseout') {
            flag = false;
            storeAnnotationData(roomNo, [...buffer])
            buffer = []
        }
        // if the flag is up, the movement of the mouse draws on the canvas
        if (e.type === 'mousemove') {
            if (flag) {
                if (isdrawMode == 1) {
                    drawOnCanvas(ctx, canvas.width, canvas.height, prevX, prevY, currX, currY, color, thickness);
                    // @todo if you draw on the canvas, you may want to let everyone know via socket.io (socket.emit...)  by sending them
                    // room, userId, canvas.width, canvas.height, prevX, prevY, currX, currY, color, thickness
                    let data = { userId, canvasWidth: canvas.width, canvasHeight: canvas.height, x1: prevX, y1: prevY, x2: currX, y2: currY, color, thickness }
                    socket.emit('draw', roomNo, data)
                    // storeAnnotationData(roomNo, { _id: roomNo, ...data })
                    buffer.push({ _id: roomNo, ...data })
                } else {
                    // ctx remove the line
                    let data = { userId, canvasWidth: canvas.width, canvasHeight: canvas.height, x1: prevX, y1: prevY, x2: 10, y2: 10 }
                    buffer.push({ _id: roomNo, ...data })
                    socket.emit('draw', roomNo, data)
                    // ctx.clearRect(prevX, prevY, 10, 10);

                }
            }
        }
    });

    $('#color').on('change', function(e) {
        color = e.target.value || 'red';
    })

    // this is code left in case you need to  provide a button clearing the canvas (it is suggested that you implement it)
    // $('.canvas-clear').on('click', function(e) {

    //     let c_width = canvas.width;
    //     let c_height = canvas.height;
    //     ctx.clearRect(0, 0, c_width, c_height);
    //     // @todo if you clear the canvas, you want to let everyone know via socket.io (socket.emit...)
    //     socket.emit('clear')
    // });

    // @todo here you want to capture the event on the socket when someone else is drawing on their canvas (socket.on...)
    // I suggest that you receive userId, canvasWidth, canvasHeight, x1, y21, x2, y2, color, thickness
    // and then you call
    //     let ctx = canvas[0].getContext('2d');
    //     drawOnCanvas(ctx, canvasWidth, canvasHeight, x1, y21, x2, y2, color, thickness)
    socket.on('draw', (data) => {
        let ctx = canvas[0].getContext('2d');
        const { canvasWidth, canvasHeight, x1, y1, x2, y2, color, thickness } = data;

        if (color) { drawOnCanvas(ctx, canvasWidth, canvasHeight, x1, y1, x2, y2, color, thickness) }
        else { eraseOnCanvas(ctx, canvasWidth, canvasHeight, x1, y1, x2, y2) }
        storeAnnotationData(roomNo, { _id: roomNo, ...data })

        buffer.push({ _id: roomNo, ...data })
    });

    // socket.on('clear', () => {
    //     let c_width = canvas.width();
    //     let c_height = canvas.height();
    //     ctx.clearRect(0, 0, c_width, c_height);
    // });

    // this is called when the src of the image is loaded
    // this is an async operation as it may take time
    img.addEventListener('load', () => {
        // it takes time before the image size is computed and made available
        // here we wait until the height is set, then we resize the canvas based on the size of the image
        let poll = setInterval(async function() {
            if (img.naturalHeight && img.clientWidth) {
                clearInterval(poll);
                // resize the canvas
                let ratioX = 1;
                let ratioY = 1;
                // if the screen is smaller than the img size we have to reduce the image to fit
                if (img.clientWidth > window.innerWidth)
                    ratioX = window.innerWidth / img.clientWidth;
                if (img.clientHeight > window.innerHeight)
                    ratioY = img.clientHeight / window.innerHeight;
                let ratio = Math.min(ratioX, ratioY);
                // resize the canvas to fit the screen and the image
                cvx.width = canvas.width = img.clientWidth * ratio;
                cvx.height = canvas.height = img.clientHeight * ratio;
                // draw the image onto the canvas
                await drawImageScaled(img, cvx, ctx);
                let bgCvx = document.getElementById('bg-canvas');
                let bgCtx = bgCvx.getContext('2d');
                bgCvx.width = canvas.width;
                bgCvx.height = canvas.height;
                console.log(cvx.offsetLeft)
                bgCvx.style.left = cvx.offsetLeft + 'px';
                await drawImageScaled(img, bgCvx, bgCtx);
                getAnnotationData(roomNo)
                    .then(data => {
                        for (let annotation of data) {
                            const { canvasWidth, canvasHeight, x1, y1, x2, y2, color, thickness } = annotation;
                            if (color)
                                drawOnCanvas(ctx, canvasWidth, canvasHeight, x1, y1, x2, y2, color, thickness)
                            else
                                eraseOnCanvas(ctx, canvasWidth, canvasHeight, x1, y1, x2, y2)
                        }
                    })
                // hide the image element as it is not needed
                img.classList.add('hidden');
            }
        }, 10);

    });
}

/**
 * called when it is required to draw the image on the canvas. We have resized the canvas to the same image size
 * so ti is simpler to draw later
 * @param img
 * @param canvas
 * @param ctx
 */
function drawImageScaled(img, canvas, ctx) {
    // get the scale
    let scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    // get the top left position of the image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let x = (canvas.width / 2) - (img.width / 2) * scale;
    let y = (canvas.height / 2) - (img.height / 2) * scale;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
}


/**
 * this is called when we want to display what we (or any other connected via socket.io) draws on the canvas
 * note that as the remote provider can have a different canvas size (e.g. their browser window is larger)
 * we have to know what their canvas size is so to map the coordinates
 * @param ctx the canvas context
 * @param canvasWidth the originating canvas width
 * @param canvasHeight the originating canvas height
 * @param prevX the starting X coordinate
 * @param prevY the starting Y coordinate
 * @param currX the ending X coordinate
 * @param currY the ending Y coordinate
 * @param color of the line
 * @param thickness of the line
 */
function drawOnCanvas(ctx, canvasWidth, canvasHeight, prevX, prevY, currX, currY, color, thickness) {
    //get the ration between the current canvas and the one it has been used to draw on the other comuter
    let ratioX = canvas.width / canvasWidth;
    let ratioY = canvas.height / canvasHeight;
    // update the value of the points to draw
    prevX *= ratioX;
    prevY *= ratioY;
    currX *= ratioX;
    currY *= ratioY;
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.stroke();
    ctx.closePath();


}

function eraseOnCanvas(ctx, canvasWidth, canvasHeight, x, y, w, h) {
    //get the ration between the current canvas and the one it has been used to draw on the other comuter
    let ratioX = canvas.width / canvasWidth;
    let ratioY = canvas.height / canvasHeight;
    // update the value of the points to draw
    x *= ratioX;
    y *= ratioY;
    w *= ratioX;
    h *= ratioY;
    ctx.clearRect(x, y, w, h);

}
