document.getElementById('continue-btn').addEventListener('click', function(event) {
    event.preventDefault(); // 阻止默认表单提交行为

    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const usernameError = document.getElementById('username-error');
    const usernameSpaceError = document.getElementById('username-space-error');
    const passwordError = document.getElementById('password-error');
    const invaildAccount = document.getElementById('invaild-account');

    //重置错误消息显示状态
    usernameError.style.display = 'none';
    usernameSpaceError.style.display = 'none';
    passwordError.style.display = 'none';
    invaildAccount.style.display = 'none';

    let valid = true;
    var username = usernameInput.value.trim();

    // 检查用户名是否为空
    if (username === '') {
        usernameError.style.display = 'block';
        valid = false;
    }

    // 检查用户名是否包含空格
    if (username.includes(' ')) {
        usernameSpaceError.style.display = 'block';
        valid = false;
    }

    // 检查密码是否为空
    var password = passwordInput.value.trim();
    if (password === '') {
        passwordError.style.display = 'block';
        valid = false;
    }

    if (valid) {
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.success == false) {
                invaildAccount.style.display = 'block';
            } else if (data.success == true) {
                console.log("登录成功");
                console.log(data.username);
                sessionStorage.setItem('username',data.username);
                setTimeout(function(){
                     window.location.href = '/chat.html';
                 },300);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    
});
// console.log("用户名",sessionStorage.getItem('username'))