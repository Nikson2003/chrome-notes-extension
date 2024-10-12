const noteInput = document.getElementById('noteInput');
const reminderTime = document.getElementById('reminderTime');
const saveNoteButton = document.getElementById('saveNote');
const notesList = document.getElementById('notesList');
const viewHistoryButton = document.getElementById('viewHistory');
const historyModal = document.getElementById('historyModal');
const historyList = document.getElementById('historyList');
const closeModal = document.querySelector('.close');

// Ensure only future dates can be selected
reminderTime.min = new Date().toISOString().slice(0, 16);

reminderTime.addEventListener('input', () => {
  const now = new Date().toISOString().slice(0, 16);
  if (reminderTime.value < now) {
    alert('Please select a present or future time.');
    reminderTime.value = now;
  }
});

// Save a new note
saveNoteButton.addEventListener('click', () => {
    const noteText = noteInput.value;
    const reminder = reminderTime.value;
  
    if (!noteText || !reminder) {
      alert('Please enter a note and valid time.');
      return;
    }
  
    const note = { text: noteText, reminder: reminder, timestamp: Date.now() };
  
    chrome.storage.local.get({ notes: [] }, (result) => {
      const notes = result.notes;
      notes.push(note);
      chrome.storage.local.set({ notes: notes }, () => {
        scheduleNotification(note);
        displayNotes();
        noteInput.value = '';
        reminderTime.value = '';
      });
    });
  });
  
  // Schedule notification using chrome.alarms
  function scheduleNotification(note) {
    const reminderTime = new Date(note.reminder).getTime();
    const timeNow = Date.now();
  
    if (reminderTime > timeNow) {
      const delayInMinutes = (reminderTime - timeNow) / 60000; // Convert ms to minutes
      chrome.alarms.create(note.text, { delayInMinutes });
    }
  }
  
// Display only non-expired notes
function displayNotes() {
  notesList.innerHTML = '';
  const now = new Date().getTime();

  chrome.storage.local.get({ notes: [] }, (result) => {
    const validNotes = result.notes.filter((note) => new Date(note.reminder).getTime() > now);

    validNotes.forEach((note, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${note.text} (Reminder: ${note.reminder})`;

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete-button';
      deleteButton.onclick = () => deleteNote(index);
      listItem.appendChild(deleteButton);

      notesList.appendChild(listItem);
    });
  });
}

// Move expired notes to history
function moveExpiredNotesToHistory() {
  const now = new Date().getTime();

  chrome.storage.local.get({ notes: [], history: [] }, (result) => {
    const notes = result.notes;
    const expiredNotes = notes.filter((note) => new Date(note.reminder).getTime() <= now);
    const validNotes = notes.filter((note) => new Date(note.reminder).getTime() > now);

    chrome.storage.local.set({ notes: validNotes, history: [...result.history, ...expiredNotes] }, displayNotes);
  });
}

// Delete a note and move it to history
function deleteNote(index) {
  chrome.storage.local.get({ notes: [], history: [] }, (result) => {
    const notes = result.notes;
    const history = result.history;
    const [deletedNote] = notes.splice(index, 1);

    history.push(deletedNote);
    chrome.storage.local.set({ notes: notes, history: history }, displayNotes);
  });
}

// View history modal
viewHistoryButton.addEventListener('click', () => {
  historyList.innerHTML = '';
  chrome.storage.local.get({ history: [] }, (result) => {
    result.history.forEach((note) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${note.text} (Deleted at: ${new Date(note.timestamp).toLocaleString()})`;
      historyList.appendChild(listItem);
    });
    historyModal.style.display = 'block';
  });
});

// Close history modal
closeModal.onclick = () => {
  historyModal.style.display = 'none';
};

// Display notes on popup load
document.addEventListener('DOMContentLoaded', () => {
  displayNotes();
  moveExpiredNotesToHistory();
});
