let lastMileage = null;


// Sidebar 

let sidebarArray = document.querySelectorAll('.sidebar');
sidebarArray.forEach(elem => elem.addEventListener('click', (e) =>{
    const target = e.target.closest('.nav-item');
    if(target){
        document.querySelectorAll('.nav-item.active').forEach(elem => elem.classList.remove('active'));
        target.classList.add('active');
    }
}));



//checking authorization

document.addEventListener('DOMContentLoaded', async function(){
    const cookie = getCookie('token');
    
    if(!cookie) {
        window.location.href = '/login.html';
    } else {
        const userId = getCookie('userId');
        const response = await fetch(`/lastRecord?userId=${userId}`, {
            method : 'GET',
            headers: {
                'Content-Type' : 'application/json',
            },
        });
        if(!response.ok){
            console.log('no data to insert yet \n getting initial mileage from USERS COLL');

            const response = await fetch(`/users?userId=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type' : 'application/json',
                },
            });
            if(!response.ok) {
                console.log(response.status)
                return;
            } else {    
                const data = await response.json();
                data.totalMileage = data.initialMileage;
                delete data.initialMileage;
                
                insertDataToHtml(data);
                return;
            }

        } else {
            const data = await response.json();
            console.log(data);
            insertDataToHtml(data);
            lastMileage = data.totalMileage
            console.log(lastMileage)
            return;
        }
    }
})



//logout button

const logoutButtons = document.querySelectorAll('.logout');
logoutButtons.forEach(element => {
    element.addEventListener('click', () => {
        document.cookie = `token=;path=/;max-age=0;secure`;
        document.cookie = `userId=;path=/;max-age=0;secure`;
        window.location.href = '/login.html';
    })
});


// add Record

document.getElementById('add-record-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputIds = ['fuelVolume', 'distance', 'totalMileage', 'fuelPrice'];
    const userId = getCookie('userId');

    if(!userId){
        console.log('no userId');
        window.location.href = '/login.html';
        return;
    }

    const formData = getAndValidateInputs(inputIds, userId, lastMileage);

    if(!formData){
        console.log('validation failed');
        return;
    } 
    console.log(formData);

    const response = await fetch('/addRecord', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });
    const data = await response.json();
    
    insertDataToHtml(data);
    lastMileage = data.totalMileage;
})


function getCookie(name) {
    const cookieArray = document.cookie.split('; ');
    const cookie = cookieArray.find(c => c.startsWith(name + '='));
    if(cookie){
        return cookie.split('=')[1];
    }
    return null;
}

function getAndValidateInputs(ids, id, lastMileage){
    let lastMileageElem = document.querySelector('.record-item.total-mileage');
    let isValid = true;
    let errorMessage = document.getElementById('error-message');
    let formData = {};
    for (let id of ids){
        let input = document.getElementById(id)
        let value = input.value.replace(',', '.');
        formData[id] = value;
        if((id == 'totalMileage'||id == 'distance') && !formData[id]) {
            formData[id] = null;
        }
    }
    if(!formData.totalMileage && !formData.distance){
        errorMessage.textContent = 'At least one of these inputs must been filled';
        return;
    }
    
    console.log('before', formData)
    for(let id of ids){
        let input = document.getElementById(id)
        if(formData[id] == null){
            formData[id] = calculateData(id, formData);
        }
        let value = parseFloat(formData[id]);
        if(id == 'totalMileage' && value != 0 && value <= lastMileage){
            errorMessage.textContent = "'Mileage can`t be less or equal to the last mileage'";
            input.classList.add('error');
            
            lastMileageElem.classList.add('bg-danger');
            isValid = false;
            break;
        }
        else if(Number.isNaN(value) || value <= 0){
            // if(id=='totalMileage' || id == 'distance') continue;
            input.classList.add('error');
            errorMessage.textContent = "Only positive numbers are allowed";
            isValid = false;
            break;
        } else {
            input.classList.remove('error');
            lastMileageElem.classList.remove('bg-danger');
            errorMessage.textContent = '';
            formData[id] = value;
        }
    }
    formData = {...formData, userId : id}
    console.log(formData)
    return isValid ? formData : null;
}

function insertDataToHtml(data) {
    Object.keys(data).forEach(key => {
        let elemId = key+'Value';
        document.getElementById(elemId).textContent = data[key];
    })
}

function calculateData(key, data) {
    let prevMileage = parseFloat(document.getElementById(key + 'Value').innerText);
    prevMileage = Number.isNaN(prevMileage) ? sessionStorage.getItem('initialMileage') : prevMileage;
    if(key == 'totalMileage') {
        return prevMileage + data.distance;
    }
    if(key == 'distance') {
        return data.totalMileage - prevMileage;
    }
}