const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

let dbData;

try {
  const data = fs.readFileSync('db.json', 'utf8');
  dbData = JSON.parse(data);
} catch (err) {
  console.error(err);
  // If the file doesn't exist or there's an error, start with an empty DB
  dbData = {
    users: [],
    events: [],
    announcements: [],
    community_posts: [],
  };
}

const saveData = () => {
  fs.writeFile('db.json', JSON.stringify(dbData, null, 2), (err) => {
    if (err) {
      console.error(err);
    }
  });
};

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Users
app.get('/api/users', (req, res) => {
  res.json(dbData.users);
});

app.post('/api/users', (req, res) => {
  const newUser = req.body;
  const newId =
    dbData.users.length > 0
      ? Math.max(...dbData.users.map((u) => u.id)) + 1
      : 1;
  newUser.id = newId;
  dbData.users.push(newUser);
  saveData();
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const updatedUser = req.body;
  const userIndex = dbData.users.findIndex((u) => u.id === userId);
  if (userIndex !== -1) {
    dbData.users[userIndex] = { ...dbData.users[userIndex], ...updatedUser };
    saveData();
    res.json(dbData.users[userIndex]);
  } else {
    res.status(404).send('User not found');
  }
});

app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = dbData.users.findIndex((u) => u.id === userId);
  if (userIndex !== -1) {
    dbData.users.splice(userIndex, 1);
    saveData();
    res.status(204).send();
  } else {
    res.status(404).send('User not found');
  }
});

// Events
app.get('/api/events', (req, res) => {
  res.json(dbData.events);
});

app.post('/api/events', (req, res) => {
  const newEvent = req.body;
  const newId =
    dbData.events.length > 0
      ? Math.max(...dbData.events.map((e) => e.id)) + 1
      : 1;
  newEvent.id = newId;
  dbData.events.push(newEvent);
  saveData();
  res.status(201).json(newEvent);
});

app.put('/api/events/:id', (req, res) => {
  const eventId = parseInt(req.params.id);
  const updatedEvent = req.body;
  const eventIndex = dbData.events.findIndex((e) => e.id === eventId);
  if (eventIndex !== -1) {
    dbData.events[eventIndex] = { ...dbData.events[eventIndex], ...updatedEvent };
    saveData();
    res.json(dbData.events[eventIndex]);
  } else {
    res.status(404).send('Event not found');
  }
});

app.delete('/api/events/:id', (req, res) => {
  const eventId = parseInt(req.params.id);
  const eventIndex = dbData.events.findIndex((e) => e.id === eventId);
  if (eventIndex !== -1) {
    dbData.events.splice(eventIndex, 1);
    saveData();
    res.status(204).send();
  } else {
    res.status(404).send('Event not found');
  }
});

// Announcements
app.get('/api/announcements', (req, res) => {
  res.json(dbData.announcements);
});

app.post('/api/announcements', (req, res) => {
  const newAnnouncement = req.body;
  const newId =
    dbData.announcements.length > 0
      ? Math.max(...dbData.announcements.map((a) => a.id)) + 1
      : 1;
  newAnnouncement.id = newId;
  dbData.announcements.push(newAnnouncement);
  saveData();
  res.status(201).json(newAnnouncement);
});

app.put('/api/announcements/:id', (req, res) => {
  const announcementId = parseInt(req.params.id);
  const updatedAnnouncement = req.body;
  const announcementIndex = dbData.announcements.findIndex((a) => a.id === announcementId);
  if (announcementIndex !== -1) {
    dbData.announcements[announcementIndex] = { ...dbData.announcements[announcementIndex], ...updatedAnnouncement };
    saveData();
    res.json(dbData.announcements[announcementIndex]);
  } else {
    res.status(404).send('Announcement not found');
  }
});

app.delete('/api/announcements/:id', (req, res) => {
  const announcementId = parseInt(req.params.id);
  const announcementIndex = dbData.announcements.findIndex((a) => a.id === announcementId);
  if (announcementIndex !== -1) {
    dbData.announcements.splice(announcementIndex, 1);
    saveData();
    res.status(204).send();
  } else {
    res.status(404).send('Announcement not found');
  }
});


// Community Posts
app.get('/api/community_posts', (req, res) => {
  res.json(dbData.community_posts);
});

app.post('/api/community_posts', (req, res) => {
  const newPost = req.body;
  const newId =
    dbData.community_posts.length > 0
      ? Math.max(...dbData.community_posts.map((p) => p.id)) + 1
      : 1;
  newPost.id = newId;
  dbData.community_posts.push(newPost);
  saveData();
  res.status(201).json(newPost);
});

app.put('/api/community_posts/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const updatedPost = req.body;
  const postIndex = dbData.community_posts.findIndex((p) => p.id === postId);
  if (postIndex !== -1) {
    dbData.community_posts[postIndex] = { ...dbData.community_posts[postIndex], ...updatedPost };
    saveData();
    res.json(dbData.community_posts[postIndex]);
  } else {
    res.status(404).send('Post not found');
  }
});

app.delete('/api/community_posts/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const postIndex = dbData.community_posts.findIndex((p) => p.id === postId);
  if (postIndex !== -1) {
    dbData.community_posts.splice(postIndex, 1);
    saveData();
    res.status(204).send();
  } else {
    res.status(404).send('Post not found');
  }
});


app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
