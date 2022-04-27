// establish a connection to the IndexedDB database and created some structure for storing the data

let db;
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};
// upon success
request.onsuccess = function (event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadTransaction();
    }
};
// checks for errors
request.onerror = function (event) {
    console.log(event.target.errorCode);
};

// set up the functionality for writing data to it
function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    const transactionObjectStore = transaction.objectStore('new_transaction');
                    transactionObjectStore.clear();
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}

//listen for app to come back online
window.addEventListener('online', uploadTransaction);