function getCurrentUsername(){
    const currentUsername = localStorage.getItem("username") || sessionStorage.getItem("username");
    if(!currentUsername){
        console.warn("存储中未找到用户名");
        return null; // 或返回一个默认值
    }
    return currentUsername;
}

var username = getCurrentUsername();
console.log(username);


document.addEventListener('DOMContentLoaded',function(){
    var username = getCurrentUsername();
    if (username) {
        loadSession(username).then(() => {
            if (document.getElementById('chat-box').children.length > 0) {
                // 如果有聊天记录，隐藏logo和建议，显示聊天界面
                document.getElementById('logo-container').style.display = 'none';
                document.getElementById('suggestions').style.display = 'none';
                document.getElementById('chat-screen').classList.remove('hidden');
                smoothScrollToBottom();
            } else {
                // 如果没有聊天记录，显示初始界面
                initializePage();
            }
        });
    } else {
        // 如果没有用户名，显示初始界面
        initializePage();
    }

    var newChatButton = document.getElementById('new-chat-button');
    newChatButton.addEventListener('click', function() {
        cleanMessages(username);
        initializePage();

    });


});
function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}


function initializePage() {
    // 显示logo和建议
    document.getElementById('logo-container').style.display = 'block';
    document.getElementById('suggestions').style.display = 'grid';
    
    // 隐藏聊天界面
    document.getElementById('chat-screen').classList.add('hidden');
    
    document.getElementById('chat-box').innerHTML = '';
    
    document.getElementById('message-input').value = '';
}

function showMenuScreen() {
    document.getElementById('logo-container').style.display = 'block';
    document.getElementById('suggestions').style.display = 'grid';
    document.getElementById('chat-screen').classList.add('hidden');
}

//监听器，是否换行还是发送
const inputField = document.getElementById('message-input');
inputField.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    var input = document.getElementById('message-input');
    var message = input.value;
    if (message.trim() === "") return;

    var chatBox = document.getElementById('chat-box');

    document.getElementById('logo-container').style.display = 'none';
    document.getElementById('suggestions').style.display = 'none';
    document.getElementById('chat-screen').classList.remove('hidden');

    appendMessage('dog.png', message, 'user-message');

    input.value = "";

    fetchChatGPTResponse(message,getCurrentUsername());
}

function appendMessage(avatarSrc, message, className) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${className}`;
    messageElement.innerHTML = `<img src="${avatarSrc}" alt="" class="avatar"><div class="message-content">${message}</div>`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageElement.querySelector('.message-content');
}

let isScrolledToBottom = true;
const chatBox = document.getElementById('chat-box');

function updateMessage(element, message) {
    element.innerHTML = message;
    if (isScrolledToBottom) {
        scrollToBottom();
    }
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 监听滚动事件
chatBox.addEventListener('scroll', function() {
    // 检查是否滚动到底部
    isScrolledToBottom = (chatBox.scrollHeight - chatBox.clientHeight <= chatBox.scrollTop +2);
});

// 在新消息添加后调用此函数
function onNewMessage() {
    if (isScrolledToBottom) {
        scrollToBottom();
    }
}

async function fetchChatGPTResponse(message, username) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message, username: username })  // 确保传递用户名
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let messageContent = '';
    const botMessage = appendMessage('/static/images/dog.jpg', '', 'bot-message');

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        messageContent += chunk;
        updateMessage(botMessage, await formatMessage(messageContent));
    }
}

async function convertMarkdownToHTML(mdText) {
    const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: mdText })
    });

    const result = await response.json();
    return result.html;
}

async function formatMessage(message) {
    const html = await convertMarkdownToHTML(message);
    return html;
}

function sendSuggestion(suggestion) {
    var input = document.getElementById('message-input');
    input.value = suggestion;
    setTimeout(() => {
        sendMessage()
    }, 200)
}

async function loadSession(username) {
    try {
        const response = await fetch(`/api/get_messages?username=${username}`, {
            method: 'GET'
        });
        if (!response.ok) {
            console.error('Failed to fetch messages:', response.statusText);
            return;
        }
        const messages = await response.json();
        await displayMessages(messages);
        return messages.length > 0; // 返回是否有消息
    } catch (error) {
        console.error('Error fetching messages:', error);
        return false;
    }
}

async function displayMessages(messages) {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
    for (const message of messages) {
        const messageContent = message.sender === 'AI' ? await convertMarkdownToHTML(message.content) : message.content;
        appendMessage(
            message.sender === 'User' ? '/static/images/dog.jpg' : '/static/images/dog.jpg',
            messageContent,
            message.sender === 'User' ? 'user-message' : 'bot-message'
        );
    }
}

function cleanMessages(username) {
    fetch('/api/clean_messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username })
    });
}
function handleLogout() {
    localStorage.removeItem('username');
}

function smoothScrollToBottom() {
    const chatBox = document.getElementById('chat-box');
    const scrollHeight = chatBox.scrollHeight;
    const scrollStep = 20; // 调整每步滚动的像素数以控制滚动速度
    const scrollInterval = 5; // 调整每步之间的间隔时间以控制滚动速度

    const scrollIntervalId = setInterval(() => {
        if (chatBox.scrollTop + chatBox.clientHeight < scrollHeight) {
            chatBox.scrollTop += scrollStep;
        } else {
            clearInterval(scrollIntervalId);
            chatBox.scrollTop = scrollHeight;
            isScrolledToBottom = true;
        }
    }, scrollInterval);
}
