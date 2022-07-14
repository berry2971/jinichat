/* nickname util */
const nicknamePrefix = ["뜨끈한", "맛있는", "뜨거운", "지글지글", "군침도는", "윤기나는", "기름진", "느글느글"];
const nicknameBody = ["국밥", "마라탕", "짜장면", "보쌈", "피자", "햄버거", "파스타", "훠궈탕", "김치찜", "양대창", "삼겹살", "항정살"];

function randomNickname() {
    const prefixIdx = randomInt(0, nicknamePrefix.length);
    const bodyIdx = randomInt(0, nicknameBody.length);
    return `${nicknamePrefix[prefixIdx]} ${nicknameBody[bodyIdx]}`;
}

function randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

/* init data */
const users = [];
let currentUser = null;

const dom = {
    messageInput: document.getElementById("messageInput"),
    messageSend: document.getElementById("messageSend"),
    messageContentBox: document.getElementById("messageContentBox"),
    nicknameInput: document.getElementById("nicknameInput"),
    nicknameSend: document.getElementById("nicknameSend"),
    userBox: document.getElementsByClassName("userBox")[0],
    talkerSpan: document.getElementsByClassName("talkerSpan")[0],
    nicknameSelectBox: document.getElementsByClassName("nicknameSelectBox")[0],
    nicknameDisplayBox: document.getElementsByClassName("nicknameDisplayBox")[0],
    currentNickname: document.getElementsByClassName("currentNickname")[0],
    messageBlanket: document.querySelector("#messageControlBox .blanket"),
};

/* socket */
const socket = io();

/* load current user */
fetch("/user-list")
    .then(resp => resp.json())
    .then(data => {
        for (const user of data) {
            users.push(user.nickname);
            addUserContent(user.nickname);
        }
    });

/* set placeholder for nicknameInput */
dom.nicknameInput.setAttribute("placeholder", randomNickname());

dom.nicknameSend.onclick = function(event) {
    event.preventDefault();

    let nickname = dom.nicknameInput.value;
    if (!nickname) {
        nickname = dom.nicknameInput.getAttribute("placeholder");
    }
    currentUser = nickname;

    socket.emit("join", nickname);

    dom.nicknameSelectBox.classList.add("hidden");
    dom.nicknameDisplayBox.classList.remove("hidden");
    dom.currentNickname.innerHTML = currentUser;

    dom.messageBlanket.classList.add("hidden");
};

dom.messageSend.onclick = function(event) {
    event.preventDefault();
    if (!dom.messageInput.value) {
        return;
    }
    const content = {
        nickname: currentUser,
        val: dom.messageInput.value,
    };

    dom.messageInput.value = "";

    socket.emit("msg", content);
};

socket.on("msg", function(payload) {
    addMessageContent(payload);
});

function hashCode(string) {
    var hash = 0, i, chr;
    if (string.length === 0) return hash;
    for (i = 0; i < string.length; i++) {
        chr   = string.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

function addMessageContent(payload) {
    const el = document.createElement("div");
    el.classList.add("messageContent");

    const el1 = document.createElement("span");
    // el1.style.color = "rgba(8, 75, 115, 0.77)";
    let hashcode = hashCode(payload.nickname);
    if (hashcode < 0) hashcode = -hashcode;
    if (hashcode % 2 == 0) {
        el1.style.color = `rgba(15, ${hashcode % 255}, ${hashcode % 255}, 0.77)`;
    } else if (hashcode % 3 == 0) {
        el1.style.color = `rgba(${hashcode % 255}, 15, ${hashcode % 255}, 0.77)`;
    } else if (hashcode % 5 == 0) {
        el1.style.color = `rgba(${hashcode % 255}, ${hashcode % 255}, 15, 0.77)`;
    } else if (hashcode % 7 == 0) {
        el1.style.color = `rgba(84, 170, ${hashcode % 255}, 0.77)`;
    } else {
        el1.style.color = `rgba(${hashcode % 255}, 60, ${hashcode % 255}, 0.77)`;
    }
    el1.innerText = payload.nickname;

    const el2 = document.createElement("span");
    el2.innerText = "💬 " + payload.val;

    el.appendChild(el1);
    el.appendChild(el2);

    dom.messageContentBox.appendChild(el);
    el.scrollIntoView();
}

socket.on("join", function(userString) {
    const user = JSON.parse(userString);
    users.push(user.nickname);
    addUserContent(user.nickname);

    const el = document.createElement("div");
    el.classList.add("messageContent");
    el.style.color = "rgba(8, 75, 115, 0.77)";
    el.innerText = `${user.nickname}님이 입장하셨습니다.`;
    dom.messageContentBox.appendChild(el);
    el.scrollIntoView();
});

function addUserContent(nickname) {
    const content = `
        <div class="userContent">${nickname}</div>
    `;
    dom.userBox.innerHTML += content;
    dom.talkerSpan.innerHTML = String(users.length);
}

socket.on("load user", function(userList) {
    for (let user of userList) {
        addUserContent(user.nickname);
    }
});

socket.on("remove user", function(nickname) {
    for (let i in users) {
        if (users[i] === nickname) {
            users.splice(i, 1);
            dom.talkerSpan.innerHTML = String(users.length);
            break;
        }
    }

    const userContents = dom.userBox.children;
    for (let userContent of userContents) {
        if (userContent.innerHTML === nickname) {
            dom.userBox.removeChild(userContent);
            break;
        }
    }

    const el = document.createElement("div");
    el.classList.add("messageContent");
    el.style.color = "rgba(8, 75, 115, 0.77)";
    el.innerText = `${nickname}님이 퇴장하셨습니다.`;
    dom.messageContentBox.appendChild(el);
    el.scrollIntoView();
});