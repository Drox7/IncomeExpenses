// 1. Открыть БД
// 2. Создать объект хранилища используя новое событие (обновить - изменив версию)
// 3. Начало транзакции и обращение запросов 
// 4. Ожидание завершения операции и прослушивание DOM событий
// 5. Преобразование результатов


document.addEventListener('DOMContentLoaded', (e) => {

    // Проверка работы БД в браузере
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    // Открытие БД 
    let request = indexedDB.open('TaskManager', 1);
    // onupgradeneededсобытие - происходит когда создается новая DB или происходит обновление существующей.
    request.onupgradeneeded = (event) => {
            let DB = event.target.result;
            // Проверка существующего объекта в БД
            if (!DB.objectStoreNames.contains('Tasks')) {
                // Создание объекта хранилища Tasks и присваивание значения id в качестве первичного ключа.
                // autoIncrement - генератор ключей, позволяющий задать уникальное значение для каждого объекта
                // options - объект с параметрами, в котором можно указать первоначальный ключ для управления свойствами в БД. 
                var ObjectStore = DB.createObjectStore('Tasks', { keyPath: 'id', autoIncrement: true });
                var ObjectStore2 = DB.createObjectStore('Customers', { keyPath: 'id', autoIncrement: true });
                // Индекса -  позволяет искать значения, хранящиеся в хранилище объектов, с использованием значения свойства хранимого объекта, а не ключа объекта.
                // Индексы принимают ограничения: Установив уникальный флаг при создании индекса, индекс гарантирует, что два объекта не будут сохранены с одинаковым значением для пути ключа индекса.             
                ObjectStore.createIndex('IndexByTask', 'task', { unique: true });
                ObjectStore.createIndex('IndexByEmail', 'email', { unique: false });
            }
        }
        // callback функции на обработку ошибок/успеха
    request.onsuccess = (event) => {
        console.log('Success! DB has been opened!');
        // ПОлучение БД
        db = event.target.result;
        // Отображение списка задач
        showTasks();
    }
    request.onerror = (event) => {
        console.log('Error! There is problem with opening your DB');
    }


});
// Функция добавления задач
function addTask(e) {
    let task = $('#task').val();
    let person = $('#person').val();
    let email = $('#email').val();
    let date = $('#date').val();
    let customer = $('#Customer').val();
    // создание новой транзакции обращение к объекту хранилища
    let transaction = db.transaction(['Tasks'], 'readwrite'); //readonly - для чтения
    // Обращение к таблице
    let store = transaction.objectStore('Tasks');
    // Создание задачи
    let Task = {
        task: task,
        person: person,
        email: email,
        date: date,
        customer: customer,
    };
    // Обращение на добавление
    let req = store.add(Task);
    req.onsuccess = (event) => {
        alert('New task was added');
        window.location.replace('001_indexedDB.html');
    };
    req.onerror = (event) => {
        alert('There is a problem with adding a new task');
        return false;
    };

}
// Функция отображения задач
function showTasks(event) {
    // Создание транзакции
    let transaction = db.transaction(['Tasks'], 'readonly');
    let store = transaction.objectStore('Tasks');
    // Обращение к существующему объекту в БД
    let index = store.index('IndexByTask');
    let output = '';
    // Создание особой метки для определения элементов внутри БД по заданному индексу
    // Курсор выбирает каждый объект в хранилище объектов или индексирует один за другим, позволяя вам что-то делать с выбранными данными.
    index.openCursor().onsuccess = (event) => {
        let cursor = event.target.result;
        if (cursor) {
            output += `<tr class='task_${cursor.value.id}'>`;
            output += `<td><span>${cursor.value.id}</span></td>`;
            output += `<td><span>${cursor.value.task}</span></td>`;
            output += `<td><span class='cursor task' contenteditable='true' data-field='person' data-id='${cursor.value.id}'>${cursor.value.person}</span></td>`;
            output += `<td><span class='cursor task' contenteditable='true' data-field='email' data-id='${cursor.value.id}'>${cursor.value.email}</span></td>`;
            output += `<td><span class='cursor task' contenteditable='true' data-field='date' data-id='${cursor.value.id}'>${cursor.value.date}</span></td>`;
            output += `<td><span class='cursor task' contenteditable='true' data-field='date' data-id='${cursor.value.id}'>${cursor.value.customer}</span></td>`;
            output += `<td><a onclick="deleteTask(${cursor.value.id})" class="btn btn-danger" href=''>Delete</a></td>`;
            output += '</tr>';
            // Продолжить до тех пор пока не закончится преебор всех элементов
            cursor.continue();
        }
        $('#tasks').html(output);
    }
}

//Удаление всех пользователей
function deleteTasks() {
    indexedDB.deleteDatabase('TaskManager');
    window.location.replace('./001_indexedDB.html');
}
//Удаление одного пользователя
function deleteTask(id) {
    let transaction = db.transaction(['Tasks'], 'readwrite');
    let store = transaction.objectStore('Tasks');
    let req = store.delete(id);
    req.onsuccess = (event) => {
        alert(`Task #${id} was deleted`);
        // Удаление элемента из DOM дерева
        $(`.task_${id}`).remove();
        return false;
    };
    req.onerror = (event) => {
        alert('There is a problem with deleting this task');
        return false;
    };
}
// Обновление информации пользователя
$('#tasks').on('blur', ".task", function() {
    // Вычисление обновленного текста
    let newText = $(this).html();
    // Нахождение полей
    let Field = $(this).data('field');
    let TaskID = $(this).data('id');
    let transaction = db.transaction(['Tasks'], 'readwrite');
    let store = transaction.objectStore('Tasks');
    let req = store.get(TaskID);
    req.onsuccess = (e) => {
        let data = req.result;
        if (Field === 'person') {
            data.person = newText;
        } else if (Field === 'email') {
            data.email = newText
        } else if (Field === 'date') {
            data.date = newText
        }
        console.log(data);
        let reqUpdate = store.put(data);
        reqUpdate.onsuccess = () => {
            console.log('Task field updated!');
        }
        reqUpdate.onerror = () => {
            console.log('Task field not updated!');
        }
    }
    req.onerror = (e) => {
        conconsole.log('No nection to DB');
    }

});