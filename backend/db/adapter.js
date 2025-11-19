/**
 * Database adapter
 * Provides a unified interface for database operations
 * Priority: Firebase > PostgreSQL > JSON file
 */

const USE_FIREBASE = process.env.USE_FIREBASE === 'true';
const USE_DATABASE = process.env.USE_DATABASE === 'true' || process.env.DB_HOST;

if (USE_FIREBASE) {
  // Use Firestore (Firebase)
  console.log('📦 Using Firestore (Firebase) as database');
  module.exports = require('./firestoreAdapter');
} else if (USE_DATABASE) {
  // Use PostgreSQL
  const { query } = require('./connection');
  
  module.exports = {
    // Users
    async getUsers() {
      const result = await query('SELECT id, email, name, role, title, avatar, last_login, created_at, updated_at FROM users ORDER BY created_at DESC');
      return result.rows;
    },
    
    async getUserById(id) {
      const result = await query('SELECT id, email, name, role, title, avatar, last_login, created_at, updated_at FROM users WHERE id = $1', [id]);
      return result.rows[0] || null;
    },
    
    async getUserByEmail(email) {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    },
    
    async createUser(userData) {
      const { email, password, name, role = 'attendee', title, avatar } = userData;
      const result = await query(
        `INSERT INTO users (email, password, name, role, title, avatar) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, email, name, role, title, avatar, created_at, updated_at`,
        [email, password, name, role, title || null, avatar || null]
      );
      return result.rows[0];
    },
    
    async updateUser(id, userData) {
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      Object.keys(userData).forEach(key => {
        if (key !== 'id' && key !== 'password') {
          fields.push(`${key} = $${paramCount}`);
          values.push(userData[key]);
          paramCount++;
        }
      });
      
      if (fields.length === 0) {
        return await this.getUserById(id);
      }
      
      values.push(id);
      const result = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} 
         RETURNING id, email, name, role, title, avatar, last_login, created_at, updated_at`,
        values
      );
      return result.rows[0] || null;
    },
    
    async updateUserLastLogin(id) {
      await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    },
    
    async deleteUser(id) {
      const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      return result.rows.length > 0;
    },
    
    // Events
    async getEvents() {
      const result = await query(`
        SELECT e.*, u.name as creator_name 
        FROM events e 
        LEFT JOIN users u ON e.created_by = u.id 
        ORDER BY e.created_at DESC
      `);
      return result.rows;
    },
    
    async getEventById(id) {
      const result = await query(`
        SELECT e.*, u.name as creator_name 
        FROM events e 
        LEFT JOIN users u ON e.created_by = u.id 
        WHERE e.id = $1
      `, [id]);
      return result.rows[0] || null;
    },
    
    async createEvent(eventData) {
      const { title, description, startTime, endTime, startDate, endDate, location, image, category, capacity, price, status, createdBy } = eventData;
      const result = await query(
        `INSERT INTO events (title, description, start_time, end_time, start_date, end_date, location, image, category, capacity, price, status, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
         RETURNING *`,
        [title, description || null, startTime || null, endTime || null, startDate || null, endDate || null, location || null, image || null, category || null, capacity || null, price || null, status || 'draft', createdBy]
      );
      return result.rows[0];
    },
    
    async updateEvent(id, eventData) {
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      Object.keys(eventData).forEach(key => {
        if (key !== 'id' && key !== 'created_by') {
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          fields.push(`${dbKey} = $${paramCount}`);
          values.push(eventData[key]);
          paramCount++;
        }
      });
      
      if (fields.length === 0) {
        return await this.getEventById(id);
      }
      
      values.push(id);
      const result = await query(
        `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
      return result.rows[0] || null;
    },
    
    async deleteEvent(id) {
      const result = await query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);
      return result.rows.length > 0;
    },
    
    // Announcements
    async getAnnouncements() {
      const result = await query(`
        SELECT a.*, u.name as creator_name 
        FROM announcements a 
        LEFT JOIN users u ON a.created_by = u.id 
        ORDER BY a.created_at DESC
      `);
      return result.rows;
    },
    
    async getAnnouncementById(id) {
      const result = await query(`
        SELECT a.*, u.name as creator_name 
        FROM announcements a 
        LEFT JOIN users u ON a.created_by = u.id 
        WHERE a.id = $1
      `, [id]);
      return result.rows[0] || null;
    },
    
    async createAnnouncement(announcementData) {
      const { title, description, content, image, priority, targetAudience, isActive, createdBy } = announcementData;
      const result = await query(
        `INSERT INTO announcements (title, description, content, image, priority, target_audience, is_active, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [title, description || null, content || null, image || null, priority || 'medium', targetAudience || ['all'], isActive !== undefined ? isActive : true, createdBy]
      );
      return result.rows[0];
    },
    
    async updateAnnouncement(id, announcementData) {
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      Object.keys(announcementData).forEach(key => {
        if (key !== 'id' && key !== 'created_by') {
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          fields.push(`${dbKey} = $${paramCount}`);
          values.push(announcementData[key]);
          paramCount++;
        }
      });
      
      if (fields.length === 0) {
        return await this.getAnnouncementById(id);
      }
      
      values.push(id);
      const result = await query(
        `UPDATE announcements SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
      return result.rows[0] || null;
    },
    
    async deleteAnnouncement(id) {
      const result = await query('DELETE FROM announcements WHERE id = $1 RETURNING id', [id]);
      return result.rows.length > 0;
    },
    
    // Community Posts
    async getCommunityPosts() {
      const result = await query(`
        SELECT cp.*, u.name as creator_name, u.avatar as creator_avatar
        FROM community_posts cp 
        LEFT JOIN users u ON cp.created_by = u.id 
        ORDER BY cp.created_at DESC
      `);
      return result.rows;
    },
    
    async getCommunityPostById(id) {
      const result = await query(`
        SELECT cp.*, u.name as creator_name, u.avatar as creator_avatar
        FROM community_posts cp 
        LEFT JOIN users u ON cp.created_by = u.id 
        WHERE cp.id = $1
      `, [id]);
      return result.rows[0] || null;
    },
    
    async createCommunityPost(postData) {
      const { title, content, time, icon, userAvatar, userName, tags, createdBy } = postData;
      const result = await query(
        `INSERT INTO community_posts (title, content, time, icon, user_avatar, user_name, tags, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [title, content || null, time || null, icon || null, userAvatar || null, userName || null, tags || [], createdBy]
      );
      return result.rows[0];
    },
    
    async updateCommunityPost(id, postData) {
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      Object.keys(postData).forEach(key => {
        if (key !== 'id' && key !== 'created_by') {
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          fields.push(`${dbKey} = $${paramCount}`);
          values.push(postData[key]);
          paramCount++;
        }
      });
      
      if (fields.length === 0) {
        return await this.getCommunityPostById(id);
      }
      
      values.push(id);
      const result = await query(
        `UPDATE community_posts SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
      return result.rows[0] || null;
    },
    
    async deleteCommunityPost(id) {
      const result = await query('DELETE FROM community_posts WHERE id = $1 RETURNING id', [id]);
      return result.rows.length > 0;
    },
  };
} else {
  // Use JSON file (fallback)
  const fs = require('fs');
  const path = require('path');
  const dbPath = path.join(__dirname, '../db.json');
  
  const readDatabase = () => {
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return { users: [], events: [], announcements: [], community_posts: [] };
    }
  };
  
  const saveDatabase = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  };
  
  module.exports = {
    // Users
    async getUsers() {
      const db = readDatabase();
      return db.users.map(({ password, ...user }) => user);
    },
    
    async getUserById(id) {
      const db = readDatabase();
      const user = db.users.find(u => u.id === id);
      return user ? (() => { const { password, ...rest } = user; return rest; })() : null;
    },
    
    async getUserByEmail(email) {
      const db = readDatabase();
      return db.users.find(u => u.email === email) || null;
    },
    
    async createUser(userData) {
      const db = readDatabase();
      const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
      const user = { id: newId, ...userData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.users.push(user);
      saveDatabase(db);
      const { password, ...rest } = user;
      return rest;
    },
    
    async updateUser(id, userData) {
      const db = readDatabase();
      const index = db.users.findIndex(u => u.id === id);
      if (index === -1) return null;
      db.users[index] = { ...db.users[index], ...userData, updatedAt: new Date().toISOString() };
      saveDatabase(db);
      const { password, ...rest } = db.users[index];
      return rest;
    },
    
    async updateUserLastLogin(id) {
      const db = readDatabase();
      const user = db.users.find(u => u.id === id);
      if (user) {
        user.lastLogin = new Date().toISOString();
        saveDatabase(db);
      }
    },
    
    async deleteUser(id) {
      const db = readDatabase();
      const index = db.users.findIndex(u => u.id === id);
      if (index === -1) return false;
      db.users.splice(index, 1);
      saveDatabase(db);
      return true;
    },
    
    // Events
    async getEvents() {
      const db = readDatabase();
      return db.events;
    },
    
    async getEventById(id) {
      const db = readDatabase();
      return db.events.find(e => e.id === id) || null;
    },
    
    async createEvent(eventData) {
      const db = readDatabase();
      const newId = db.events.length > 0 ? Math.max(...db.events.map(e => e.id)) + 1 : 1;
      const event = { id: newId, ...eventData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.events.push(event);
      saveDatabase(db);
      return event;
    },
    
    async updateEvent(id, eventData) {
      const db = readDatabase();
      const index = db.events.findIndex(e => e.id === id);
      if (index === -1) return null;
      db.events[index] = { ...db.events[index], ...eventData, updatedAt: new Date().toISOString() };
      saveDatabase(db);
      return db.events[index];
    },
    
    async deleteEvent(id) {
      const db = readDatabase();
      const index = db.events.findIndex(e => e.id === id);
      if (index === -1) return false;
      db.events.splice(index, 1);
      saveDatabase(db);
      return true;
    },
    
    // Announcements
    async getAnnouncements() {
      const db = readDatabase();
      return db.announcements;
    },
    
    async getAnnouncementById(id) {
      const db = readDatabase();
      return db.announcements.find(a => a.id === id) || null;
    },
    
    async createAnnouncement(announcementData) {
      const db = readDatabase();
      const newId = db.announcements.length > 0 ? Math.max(...db.announcements.map(a => a.id)) + 1 : 1;
      const announcement = { id: newId, ...announcementData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.announcements.push(announcement);
      saveDatabase(db);
      return announcement;
    },
    
    async updateAnnouncement(id, announcementData) {
      const db = readDatabase();
      const index = db.announcements.findIndex(a => a.id === id);
      if (index === -1) return null;
      db.announcements[index] = { ...db.announcements[index], ...announcementData, updatedAt: new Date().toISOString() };
      saveDatabase(db);
      return db.announcements[index];
    },
    
    async deleteAnnouncement(id) {
      const db = readDatabase();
      const index = db.announcements.findIndex(a => a.id === id);
      if (index === -1) return false;
      db.announcements.splice(index, 1);
      saveDatabase(db);
      return true;
    },
    
    // Community Posts
    async getCommunityPosts() {
      const db = readDatabase();
      return db.community_posts;
    },
    
    async getCommunityPostById(id) {
      const db = readDatabase();
      return db.community_posts.find(p => p.id === id) || null;
    },
    
    async createCommunityPost(postData) {
      const db = readDatabase();
      const newId = db.community_posts.length > 0 ? Math.max(...db.community_posts.map(p => p.id)) + 1 : 1;
      const post = { id: newId, ...postData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.community_posts.push(post);
      saveDatabase(db);
      return post;
    },
    
    async updateCommunityPost(id, postData) {
      const db = readDatabase();
      const index = db.community_posts.findIndex(p => p.id === id);
      if (index === -1) return null;
      db.community_posts[index] = { ...db.community_posts[index], ...postData, updatedAt: new Date().toISOString() };
      saveDatabase(db);
      return db.community_posts[index];
    },
    
    async deleteCommunityPost(id) {
      const db = readDatabase();
      const index = db.community_posts.findIndex(p => p.id === id);
      if (index === -1) return false;
      db.community_posts.splice(index, 1);
      saveDatabase(db);
      return true;
    },
  };
}

