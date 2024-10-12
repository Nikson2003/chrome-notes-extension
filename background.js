// Listen for alarms and trigger notifications
chrome.alarms.onAlarm.addListener((alarm) => {
    chrome.notifications.create(alarm.name, {
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Reminder',
      message: `It's time for: ${alarm.name}`,
      priority: 2
    });
  });
  