window.mobileCheck = function () {
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};
var userIDStoreKey = "rc:userid"
var userNameStoreKey = "rc:username"
var accessTokenKey = "rc:accesstoken"
const LEFT = "left"
const RIGHT = "right"

const EVENT_TEXT = 0
const EVENT_ACTION = 1
const EVENT_SEEN = 2
const EVENT_FILE = 3

var USER_ID = ""
if (localStorage.getItem(userIDStoreKey) !== null) {
    USER_ID = localStorage.getItem(userIDStoreKey)
} else {
    window.location.href = '/'
}
var ACCESS_TOKEN = ""
if (localStorage.getItem(accessTokenKey) !== null) {
    ACCESS_TOKEN = localStorage.getItem(accessTokenKey)
} else {
    window.location.href = '/'
}
var USER_IMG = getUserImageURL(USER_ID)

var ID2NAME = {}
var USER_NAME = ""
if (localStorage.getItem(userNameStoreKey) !== null) {
    USER_NAME = localStorage.getItem(userNameStoreKey)
    ID2NAME[USER_ID] = USER_NAME
}
var ONLINE_USERS = new Set()
var peerMessages = []

var isPageHidden = false
document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === 'visible') {
        isPageHidden = false
        if (chatroom[0].scrollHeight === initialChatScrollHeight) {
            markMessagesAsSeen()
        }
    } else if (document.visibilityState === 'hidden') {
        isPageHidden = true
    }
})

var protocol
var loc = window.location
if (loc.protocol === "https:") {
    protocol = "wss:"
} else {
    protocol = "ws:"
}
var chatUrl = protocol + "//" + window.location.host + "/api/chat?uid=" + USER_ID + "&access_token=" + ACCESS_TOKEN
var ws
var chatroom = document.getElementsByClassName("msger-chat")
var initialChatScrollHeight = chatroom[0].scrollHeight
var text = document.getElementById("msg")
var upload = document.getElementById("upload")
var fileInput = document.getElementById("file")
var send = document.getElementById("send")
var leave = document.getElementById("leave")

var modal = document.getElementById("myModal")
var modalImg = document.getElementById("img01")
var span = document.getElementsByClassName("close")[0]
span.onclick = function () {
    modal.style.display = "none"
}

var timeout = setTimeout(function () { }, 0)
//var userTypingID = 'usertyping'
var peerTypingID = 'peertyping'
var isTyping = false
text.addEventListener('keyup', function () {
    markMessagesAsSeen()
    clearTimeout(timeout)
    if (!isTyping) {
        //insertMsg(getTypingMessage(USER_ID, RIGHT, userTypingID), chatroom[0], true)
        sendActionMessage("istyping")
    }
    isTyping = true
    timeout = setTimeout(function () {
        // let el = document.getElementById(userTypingID)
        // if (el !== null) {
        //     el.remove()
        // }
        sendActionMessage("endtyping")
        isTyping = false
    }, 1000)
})

chatroom[0].addEventListener("scroll", function (e) {
    if (!isPageHidden && (chatroom[0].scrollHeight - 1.2 * chatroom[0].offsetHeight <= chatroom[0].scrollTop)) {
        markMessagesAsSeen()
    }
})
chatroom[0].addEventListener("touchstart", function (e) {
    text.blur()
})

function markMessagesAsSeen() {
    for (let i = peerMessages.length - 1; i >= 0; i--) {
        if (peerMessages[i].seen) {
            break
        } else {
            peerMessages[i].seen = true
            ws.send(JSON.stringify({
                "event": EVENT_SEEN,
                "user_id": peerMessages[i].user_id,
                "payload": peerMessages[i].message_id,
            }))
        }
    }
}
function uploadFile(file) {
    let fd = new FormData()
    fd.append('file', file)
    fetch('/api/file', {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + ACCESS_TOKEN
        }),
        body: fd
    })
        .then(res => {
            if (res.status !== 201) {
                throw Error(res.statusText)
            }
            return res.json()
        })
        .then(json => {
            sendFileMessage(json.file_name, json.file_url)
        })
        .catch(err => {
            console.log(`Error: ${err}`)
        });
}
upload.addEventListener("pointerdown", function (e) {
    upload.style.color = "black"
})
upload.addEventListener("pointerup", function (e) {
    upload.style.color = "gray"
})
send.addEventListener("pointerdown", function (e) {
    e.preventDefault()
    sendTextMessage()
    text.setAttribute("rows", 1)
    text.focus()
    send.style.color = "#0a1869"
})
send.addEventListener("pointerup", function (e) {
    e.preventDefault()
    send.style.color = "#25A3FF"
})
send.addEventListener("click", function (e) {
    text.focus()
})
leave.onclick = async function (e) {
    var result = confirm("Are you sure you want to leave?")
    if (result) {
        try {
            await deleteChannel()
            localStorage.removeItem(accessTokenKey)
            window.location.reload()
        } catch (err) {
            console.log(`Error: ${err}`)
        }
    }
}
text.onkeydown = function (e) {
    if (text.value === "\n") {
        text.value = ""
    }
    if (window.mobileCheck()) {
        if (e.keyCode === 13) {
            text.setAttribute("rows", parseInt(text.getAttribute("rows"), 10) + 1)
        }
    } else if (e.keyCode === 13) {
        if (!e.shiftKey) {
            sendTextMessage()
            text.setAttribute("rows", 1)
        } else {
            text.setAttribute("rows", parseInt(text.getAttribute("rows"), 10) + 1)
        }
    }
}
function connectWebSocket() {
    ws = new WebSocket(chatUrl)
    ws.addEventListener('open', async function (e) {
        if (USER_NAME === "") {
            try {
                await getUserName()
            } catch (err) {
                console.log(`Error: ${err}`)
            }
        }
        try {
            insertDummy()
            await getAllChannelUserNames()
            await fetchMessages()
        } catch (err) {
            console.log(`Error: ${err}`)
        }
        document.getElementById("msg").disabled = false
    })
    ws.addEventListener('message', async function (e) {
        var m = JSON.parse(e.data)
        if (m.event === EVENT_ACTION) {
            switch (m.payload) {
                case "waiting":
                case "joined":
                case "offline":
                    try {
                        await updateOnlineUsers()
                    } catch (err) {
                        console.log(`Error: ${err}`)
                    }
                    break
                case "endtyping":
                    let el = document.getElementById(peerTypingID)
                    if (el !== null) {
                        el.remove()
                    }
                    break
                case "leaved":
                    try {
                        await updateOnlineUsers()
                    } catch (err) {
                        console.log(`Error: ${err}`)
                    }
                    localStorage.removeItem(accessTokenKey)
                    ACCESS_TOKEN = ""
                    fileInput.disabled = true
                    ws.close()
                    break
            }
        }
        var msg = await processMessage(m)
        if (msg !== "") {
            if (m.event === EVENT_TEXT) {
                // let el = (m.user_id === USER_ID) ? document.getElementById(userTypingID) : document.getElementById(peerTypingID)
                if (m.user_id !== USER_ID) {
                    let el = document.getElementById(peerTypingID)
                    if (el !== null) {
                        el.remove()
                    }
                }
            }
            if (m.event === EVENT_TEXT || m.event === EVENT_FILE) {
                if (!window.mobileCheck() && isPageHidden) {
                    sendBrowserNotification("You got a new message")
                }
            }
            var isSelf = (m.user_id === USER_ID)
            insertMsg(msg, chatroom[0], isSelf)
            if ((m.event === EVENT_TEXT || m.event === EVENT_FILE) && !isSelf) {
                peerMessages.push(m)
                if (!isPageHidden && chatroom[0].scrollHeight === initialChatScrollHeight) {
                    markMessagesAsSeen()
                }
            }
            if (m.event === EVENT_ACTION && m.payload === "leaved") {
                insertMsg(getReturnHomeMessage(), chatroom[0], isSelf)
            }
        }
    })

    ws.addEventListener('close', async function (e) {
        document.getElementById("headstatus").innerHTML = `
        <i class="fas fa-circle icon-red fa-xs"></i><span style="margin-left: 10px; font-size: 1em;">disconnected</span>
    `
        document.getElementById("msg").disabled = true
        if (ACCESS_TOKEN !== "" && !isPageHidden) {
            setTimeout(function () {
                connectWebSocket()
            }, 1000)
        }
    })
}
connectWebSocket()

window.onbeforeunload = function () {
    ws.onclose = function () { }; // disable onclose handler first
    ws.close();
};

window.addEventListener('load', function () {
    Notification.requestPermission(function (status) {
        // This allows to use Notification.permission with Chrome/Safari
        if (Notification.permission !== status) {
            Notification.permission = status
        }
    })
})

function sendBrowserNotification(msg) {
    if (Notification && Notification.permission === "granted") {
        var n = new Notification(msg)
    }
    else if (Notification && Notification.permission !== "denied") {
        Notification.requestPermission(function (status) {
            if (Notification.permission !== status) {
                Notification.permission = status
            }
            // If the user said okay
            if (status === "granted") {
                var n = new Notification(msg)
            }
        })
    }
}

async function getAllChannelUserNames() {
    return fetch(`/api/chanusers`, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + ACCESS_TOKEN
        })
    })
        .then((response) => {
            if (response.status !== 200) {
                throw Error(response.statusText)
            }
            return response.json()
        })
        .then(async (result) => {
            for (const userID of result.user_ids) {
                if ((userID !== USER_ID) && !(userID in ID2NAME)) {
                    await setPeerName(userID)
                }
            }
        })
        .catch(err => {
            console.log(`Error: ${err}`)
        });
}

async function fetchMessages() {
    let response = await fetch(`/api/channel/messages`, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + ACCESS_TOKEN
        })
    })
    let result
    try {
        if (response.status !== 200) {
            throw Error(response.statusText)
        }
        result = await response.json()
    } catch (err) {
        console.log(`Error: ${err}`)
        return
    }
    for (const message of result.messages) {
        let el = document.getElementById(message.message_id)
        if (el === null) {
            var msg = await processMessage(message)
            chatroom[0].insertAdjacentHTML("beforeend", msg)
            if ((message.event === EVENT_TEXT || message.event === EVENT_FILE) && message.user_id !== USER_ID) {
                peerMessages.push(message)
            }
        }
    }
    if (result.messages.length === 0) {
        insertMsg(getActionMessage("Matched!"), chatroom[0], true)
    }
    let firstUnreadMessageID = -1
    for (let i = peerMessages.length - 1; i >= 0; i--) {
        if (i === peerMessages.length - 1 && peerMessages[i].seen) {
            break
        }
        if (!peerMessages[i].seen) {
            while (!peerMessages[i].seen) {
                i--
            }
            firstUnreadMessageID = peerMessages[i + 1].message_id
            break
        }
    }
    if (firstUnreadMessageID !== -1) {
        document.getElementById(`${firstUnreadMessageID}`).scrollIntoView()
    } else {
        chatroom[0].scrollTop = chatroom[0].scrollHeight
    }
}

async function processMessage(m) {
    if (!(m.user_id in ID2NAME)) {
        await setPeerName(m.user_id)
    }
    var msg = ""
    switch (m.event) {
        case EVENT_TEXT:
            let d = new Date(m.time)
            var time = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
            if (m.user_id === USER_ID) {
                msg = getTextMessage(m.message_id, USER_ID, RIGHT, m.payload, time, m.seen)
            } else {
                msg = getTextMessage(m.message_id, m.user_id, LEFT, m.payload, time, m.seen)
            }
            break
        case EVENT_ACTION:
            var actionMsg = ""
            switch (m.payload) {
                case "waiting":
                    break
                case "joined":
                    break
                case "offline":
                    break
                case "leaved":
                    if (m.user_id !== USER_ID) {
                        actionMsg = ID2NAME[m.user_id] + " leaved, channel closed"
                    }
                    break
                case "istyping":
                    if (m.user_id !== USER_ID) {
                        msg = getTypingMessage(m.user_id, LEFT, peerTypingID)
                    }
                    break
            }
            if (actionMsg !== "") {
                msg = getActionMessage(actionMsg)
            }
            break
        case EVENT_SEEN:
            if (m.user_id === USER_ID) {
                let id = `seen-${m.payload}`
                let el = document.getElementById(id)
                while (el === null) {
                    await sleep(250)
                    el = document.getElementById(id)
                }
                el.textContent = "seen"
            }
            break
        case EVENT_FILE:
            let d1 = new Date(m.time)
            var time1 = `${d1.getFullYear()}/${d1.getMonth() + 1}/${d1.getDate()} ${String(d1.getHours()).padStart(2, "0")}:${String(d1.getMinutes()).padStart(2, "0")}`
            let filepayload = JSON.parse(m.payload)
            if (m.user_id === USER_ID) {
                msg = getFileMessage(m.message_id, USER_ID, RIGHT, filepayload.file_name, filepayload.file_url, time1, m.seen)
            } else {
                msg = getFileMessage(m.message_id, m.user_id, LEFT, filepayload.file_name, filepayload.file_url, time1, m.seen)
            }
            break
    }
    return msg
}

async function getUserName() {
    return fetch(`/api/user/${USER_ID}/name`)
        .then((response) => {
            if (response.status !== 200) {
                throw Error(response.statusText)
            }
            return response.json()
        })
        .then((result) => {
            USER_NAME = result.name
            ID2NAME[USER_ID] = USER_NAME
        })
        .catch(err => {
            console.log(`Error: ${err}`)
        });
}
async function setPeerName(peerID) {
    return fetch(`/api/user/${peerID}/name`)
        .then((response) => {
            if (response.status !== 200) {
                throw Error(response.statusText)
            }
            return response.json()
        })
        .then((result) => {
            ID2NAME[peerID] = result.name
        })
        .catch(err => {
            console.log(`Error: ${err}`)
        });
}

async function updateOnlineUsers() {
    return fetch(`/api/chanusers/online`, {
        method: 'GET',
        headers: new Headers({
            'Authorization': 'Bearer ' + ACCESS_TOKEN
        })
    })
        .then((response) => {
            if (response.status !== 200) {
                throw Error(response.statusText)
            }
            return response.json()
        })
        .then(async (result) => {
            var curOnlineUsers = new Set()
            for (const userID of result.user_ids) {
                var name = ""
                if (userID in ID2NAME) {
                    name = ID2NAME[userID]
                } else {
                    await setPeerName(userID)
                }
                name = ID2NAME[userID]
                curOnlineUsers.add(JSON.stringify(
                    {
                        id: userID,
                        name: name
                    }
                ))
            }
            ONLINE_USERS = curOnlineUsers
            var onlineMsg = ""
            for (var onlinerUserStr of ONLINE_USERS) {
                var onlineUser = JSON.parse(onlinerUserStr)
                if (onlineUser.id === USER_ID) {
                    continue
                }
                if (onlineMsg !== "") {
                    onlineMsg += ", "
                }
                onlineMsg += onlineUser.name
            }
            if (onlineMsg === "") {
                onlineMsg = "only you"
            }
            document.getElementById("headstatus").innerHTML = `
                <i class="fas fa-circle icon-green fa-xs"></i><span style="margin-left: 10px; font-size: 1em; font-weight: bold;">${onlineMsg}</span>
                `
        })
        .catch(err => {
            console.log(`Error: ${err}`)
        });
}

async function deleteChannel() {
    return fetch(`/api/channel?delby=${USER_ID}`, {
        method: 'DELETE',
        headers: new Headers({
            'Authorization': 'Bearer ' + ACCESS_TOKEN
        })
    })
}

function getUserImageURL(userID) {
    return "https://avatars.dicebear.com/api/pixel-art/" + userID + ".svg"
}

function onlySpaces(str) {
    return str.trim().length === 0
}

function sendTextMessage() {
    if (!onlySpaces(text.value)) {
        ws.send(JSON.stringify({
            "event": EVENT_TEXT,
            "user_id": USER_ID,
            "payload": text.value,
        }))
        text.value = ""
    }
}

function sendActionMessage(action) {
    ws.send(JSON.stringify({
        "event": EVENT_ACTION,
        "user_id": USER_ID,
        "payload": action,
    }))
}

function sendFileMessage(fileName, fileURL) {
    let payload = {
        "file_name": fileName,
        "file_url": fileURL
    }
    ws.send(JSON.stringify({
        "event": EVENT_FILE,
        "user_id": USER_ID,
        "payload": JSON.stringify(payload),
    }))
}

function getFileMessage(messageID, userID, side, fileName, fileURL, time, seen) {
    let extention = getFileExtention(fileURL)
    let isImg = (extention === "jpg" || extention === "png" || extention === "jpeg")
    let fileView = ""
    if (isImg) {
        fileView = `<img id="img-${messageID}" onload="this.style.visibility='visible'" src=${fileURL} loading="lazy" alt='' style="max-width:55%;border-radius: 15px;visibility: hidden;" onclick="showModal(this.src)"/>`
    } else {
        let color = "black"
        if (side === RIGHT) {
            color = "white"
        }
        fileView = `
        <div class="msg-bubble">
          <div class="msg-text">
            <a href=${fileURL} download target="_blank" style="color: ${color}">
              <div style="overflow-wrap: break-word;">${fileName}</div>
            </a>
          </div>
        </div>
        `
    }
    var msg = `
    <div id="${messageID}" class="msg ${side}-msg">
      <div class="msg-img" style="background-image: url(${getUserImageURL(userID)})"></div>
      ${fileView}
    `
    if (side === RIGHT) {
        var seenMsg = ""
        if (seen) {
            seenMsg = "seen"
        }
        msg += `<div style="margin-right: 10px; color: #a6a6a6"><div id="seen-${messageID}" class="msg-info-seen">${seenMsg}</div><div class="msg-info-time">${time.split(' ')[1]}</div></div>`
    } else {
        msg += `<div style="margin-left: 10px; color: #a6a6a6"><div class="msg-info-time">${time.split(' ')[1]}</div></div>`
    }
    msg += `</div>`
    return msg
}

function showModal(src) {
    modal.style.display = "block";
    modalImg.src = src;
}

function getActionMessage(msg) {
    var msg = `<br><div class="msg-left">${msg}</div><br>`
    return msg
}

function getTextMessage(messageID, userID, side, text, time, seen) {
    var msg = `
    <div id="${messageID}" class="msg ${side}-msg">
      <div class="msg-img" style="background-image: url(${getUserImageURL(userID)})"></div>

      <div class="msg-bubble">

        <div class="msg-text" style="overflow-wrap: break-word;">${urlify(text).replace(/(?:\r|\n|\r\n)/g, '<br>')}</div>
      </div>
    `
    if (side === RIGHT) {
        var seenMsg = ""
        if (seen) {
            seenMsg = "seen"
        }
        msg += `<div style="margin-right: 10px; color: #a6a6a6"><div id="seen-${messageID}" class="msg-info-seen">${seenMsg}</div><div class="msg-info-time">${time.split(' ')[1]}</div></div>`
    } else {
        msg += `<div style="margin-left: 10px; color: #a6a6a6"><div class="msg-info-time">${time.split(' ')[1]}</div></div>`
    }
    msg += `</div>`
    return msg
}

function getTypingMessage(userID, side, id) {
    return `
    <div class="msg ${side}-msg" id="${id}">
        <div class="msg-img" style="background-image: url(${getUserImageURL(userID)})"></div>
        <div class="chat-bubble">
            <div class="typing">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>
    </div>
    `
}

function getReturnHomeMessage() {
    return `
    <div class="msg-left"><a href="/" style="text-decoration: none; color: #1a75ff">Back</a></div><br>
    `
}

function insertMsg(msg, domObj, isSelf) {
    domObj.insertAdjacentHTML("beforeend", msg)
    if (isSelf) {
        domObj.scrollTop = domObj.scrollHeight
    } else {
        if (domObj.scrollHeight - 1.2 * domObj.offsetHeight <= domObj.scrollTop) {
            domObj.scrollTop = domObj.scrollHeight
        }
    }
    if (text.value === "\n") {
        text.value = ""
    }
}

function insertDummy() {
    while (chatroom[0].scrollHeight === initialChatScrollHeight) {
        let dummy = `<div class="msg-left" style="visibility: hidden;">dummy</div>`
        chatroom[0].insertAdjacentHTML("beforeend", dummy)
    }
}

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function (url) {
        return '<a href="' + url + '">' + url + '</a>'
    })
    // or alternatively
    // return text.replace(urlRegex, '<a href="$1">$1</a>')
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

function auto_grow(element) {
    element.style.height = "5px";
    element.style.height = (element.scrollHeight) + "px"
}

function getFileExtention(filename) {
    var a = filename.split(".")
    if (a.length === 1 || (a[0] === "" && a.length === 2)) {
        return ""
    }
    return a.pop().toLowerCase()
}
