const firebaseConfig = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * Firestore Database Adapter
 * Provides the same interface as the existing database adapter
 * Works seamlessly with Firestore
 */

// Helper to convert Firestore timestamp to ISO string
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return timestamp;
};

// Helper to convert document to plain object
const docToObject = (doc) => {
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    lastLogin: convertTimestamp(data.lastLogin),
  };
};

module.exports = {
  // Users
  async getUsers() {
    try {
      const usersRef = firebaseConfig.db.collection('users');
      const snapshot = await usersRef.orderBy('createdAt', 'desc').get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        const { password, ...user } = data;
        return {
          id: doc.id,
          ...user,
          createdAt: convertTimestamp(user.createdAt),
          updatedAt: convertTimestamp(user.updatedAt),
          lastLogin: convertTimestamp(user.lastLogin),
        };
      });
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  async getUserById(id) {
    try {
      const userDoc = await firebaseConfig.db.collection('users').doc(id).get();
      if (!userDoc.exists) return null;

      const data = userDoc.data();
      const { password, ...user } = data;
      return {
        id: userDoc.id,
        ...user,
        createdAt: convertTimestamp(user.createdAt),
        updatedAt: convertTimestamp(user.updatedAt),
        lastLogin: convertTimestamp(user.lastLogin),
      };
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  },

  async getUserByEmail(email) {
    try {
      const usersRef = firebaseConfig.db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
        lastLogin: convertTimestamp(doc.data().lastLogin),
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  },

  async createUser(userData) {
    try {
      const { id, email, password, name, role = 'attendee', title, avatar } = userData;

      // Use provided ID (Firebase UID) if available, otherwise let Firestore generate one
      const userRef = id ? firebaseConfig.db.collection('users').doc(id) : firebaseConfig.db.collection('users').doc();

      const user = {
        email,
        password: password || null, // Note: Firebase Auth handles passwords, but keeping for compatibility
        name,
        role,
        title: title || null,
        avatar: avatar || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await userRef.set(user);

      const { password: _, ...userResponse } = user;
      return {
        id: userRef.id,
        ...userResponse,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(id, userData) {
    try {
      const userRef = firebaseConfig.db.collection('users').doc(id);
      const updateData = {
        ...userData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Remove password from update if present (should use separate endpoint)
      delete updateData.password;
      delete updateData.id;

      await userRef.update(updateData);
      return await this.getUserById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async updateUserLastLogin(id) {
    try {
      await firebaseConfig.db.collection('users').doc(id).update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user last login:', error);
      throw error;
    }
  },

  async deleteUser(id) {
    try {
      await firebaseConfig.db.collection('users').doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Events
  async getEvents() {
    try {
      const eventsRef = firebaseConfig.db.collection('events');
      const snapshot = await eventsRef.orderBy('createdAt', 'desc').get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
        startDate: convertTimestamp(doc.data().startDate),
        endDate: convertTimestamp(doc.data().endDate),
      }));
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  },

  async getEventById(id) {
    try {
      const eventDoc = await firebaseConfig.db.collection('events').doc(id).get();
      if (!eventDoc.exists) return null;

      const data = eventDoc.data();
      return {
        id: eventDoc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        startDate: convertTimestamp(data.startDate),
        endDate: convertTimestamp(data.endDate),
      };
    } catch (error) {
      console.error('Error getting event by id:', error);
      throw error;
    }
  },

  async createEvent(eventData) {
    try {
      const eventRef = firebaseConfig.db.collection('events').doc();

      const event = {
        ...eventData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await eventRef.set(event);
      return {
        id: eventRef.id,
        ...event,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  async updateEvent(id, eventData) {
    try {
      const eventRef = firebaseConfig.db.collection('events').doc(id);
      const updateData = {
        ...eventData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      delete updateData.id;

      await eventRef.update(updateData);
      return await this.getEventById(id);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  async deleteEvent(id) {
    try {
      await firebaseConfig.db.collection('events').doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  // Announcements
  async getAnnouncements() {
    try {
      const announcementsRef = firebaseConfig.db.collection('announcements');
      const snapshot = await announcementsRef.orderBy('createdAt', 'desc').get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
      }));
    } catch (error) {
      console.error('Error getting announcements:', error);
      throw error;
    }
  },

  async getAnnouncementById(id) {
    try {
      const announcementDoc = await firebaseConfig.db.collection('announcements').doc(id).get();
      if (!announcementDoc.exists) return null;

      const data = announcementDoc.data();
      return {
        id: announcementDoc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      };
    } catch (error) {
      console.error('Error getting announcement by id:', error);
      throw error;
    }
  },

  async createAnnouncement(announcementData) {
    try {
      const announcementRef = firebaseConfig.db.collection('announcements').doc();

      const announcement = {
        ...announcementData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await announcementRef.set(announcement);
      return {
        id: announcementRef.id,
        ...announcement,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  },

  async updateAnnouncement(id, announcementData) {
    try {
      const announcementRef = firebaseConfig.db.collection('announcements').doc(id);
      const updateData = {
        ...announcementData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      delete updateData.id;

      await announcementRef.update(updateData);
      return await this.getAnnouncementById(id);
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  },

  async deleteAnnouncement(id) {
    try {
      await firebaseConfig.db.collection('announcements').doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  },

  // Community Posts
  async getCommunityPosts() {
    try {
      const postsRef = firebaseConfig.db.collection('community_posts');
      const snapshot = await postsRef.orderBy('createdAt', 'desc').get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
      }));
    } catch (error) {
      console.error('Error getting community posts:', error);
      throw error;
    }
  },

  async getCommunityPostById(id) {
    try {
      const postDoc = await firebaseConfig.db.collection('community_posts').doc(id).get();
      if (!postDoc.exists) return null;

      const data = postDoc.data();
      return {
        id: postDoc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      };
    } catch (error) {
      console.error('Error getting community post by id:', error);
      throw error;
    }
  },

  async createCommunityPost(postData) {
    try {
      const postRef = firebaseConfig.db.collection('community_posts').doc();

      const post = {
        ...postData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await postRef.set(post);
      return {
        id: postRef.id,
        ...post,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating community post:', error);
      throw error;
    }
  },

  async updateCommunityPost(id, postData) {
    try {
      const postRef = firebaseConfig.db.collection('community_posts').doc(id);
      const updateData = {
        ...postData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      delete updateData.id;

      await postRef.update(updateData);
      return await this.getCommunityPostById(id);
    } catch (error) {
      console.error('Error updating community post:', error);
      throw error;
    }
  },

  async deleteCommunityPost(id) {
    try {
      await firebaseConfig.db.collection('community_posts').doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting community post:', error);
      throw error;
    }
  },
};

