//register 

document.getElementById('registration-form').addEventListener('submit', async function(e){
    e.preventDefault(); // Предотвращаем стандартное поведение формы

    const formData = {
        email : document.getElementById('register-email').value,
        password : document.getElementById('register-password').value,
        initialMileage : +document.getElementById('initial-mileage').value
    };

    // sending data to server
    const response = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });

    const {userId, token, message, initialMileage} = await response.json();
    if(userId != undefined && token != undefined) {
        sessionStorage.setItem('initialMileage', initialMileage);
        document.cookie = `token=${token};path=/;max-age=1800;secure`;
        document.cookie = `userId=${userId};path=/;max-age=1800;secure`;
        window.location.href = '/index.html';
    }
    console.log('Response:', {userId, token, message, initialMileage});
});


