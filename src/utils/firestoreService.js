/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

export const firestoreService = {
  // === USERS SERVICE ===
  async getUser(uid) {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  },

  async createUserProfile(uid, data) {
    const docRef = doc(db, 'users', uid);
    const legacyRef = doc(db, 'userAccounts', uid);
    const payload = {
      uid,
      id: uid,
      createdAt: new Date().toISOString(),
      ...data
    };
    await setDoc(docRef, payload);
    await setDoc(legacyRef, payload);
    return payload;
  },

  async updateUserProfile(uid, data) {
    const docRef = doc(db, 'users', uid);
    const legacyRef = doc(db, 'userAccounts', uid);
    await updateDoc(docRef, data);
    await updateDoc(legacyRef, data);
  },

  async getAllUsers() {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(doc => ({ uid: doc.id, id: doc.id, ...doc.data() }));
  },

  // === NOTICES SERVICE ===
  async getNotices() {
    const noticesCol = collection(db, 'notices');
    const snap = await getDocs(query(noticesCol, orderBy('createdAt', 'desc')));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addNotice(notice) {
    const id = `n_${Date.now()}`;
    const docRef = doc(db, 'notices', id);
    const data = {
      id,
      title: notice.title,
      description: notice.description || notice.content || '',
      content: notice.content || notice.description || '',
      attachmentUrl: notice.attachmentUrl || notice.image || '',
      image: notice.image || notice.attachmentUrl || '',
      createdBy: notice.createdBy || 'Admin',
      createdAt: new Date().toISOString(),
      date: notice.date || new Date().toISOString(),
      active: notice.active !== undefined ? notice.active : true,
      type: notice.type || 'Announcement'
    };
    await setDoc(docRef, data);
    return data;
  },

  async updateNotice(id, notice) {
    const docRef = doc(db, 'notices', id);
    const data = {
      title: notice.title,
      description: notice.description || notice.content || '',
      content: notice.content || notice.description || '',
      attachmentUrl: notice.attachmentUrl || notice.image || '',
      image: notice.image || notice.attachmentUrl || '',
      active: notice.active,
      type: notice.type || 'Announcement'
    };
    await updateDoc(docRef, data);
  },

  async deleteNotice(id) {
    await deleteDoc(doc(db, 'notices', id));
  },

  // === COMPLAINTS SERVICE ===
  async getComplaints() {
    const ref = collection(db, 'complaints');
    const snap = await getDocs(ref);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addComplaint(complaint) {
    const id = `c_${Date.now()}`;
    const docRef = doc(db, 'complaints', id);
    const data = {
      id,
      subject: complaint.subject || complaint.title || '',
      title: complaint.title || complaint.subject || '',
      description: complaint.description || '',
      category: complaint.category || 'General',
      status: complaint.status || 'Pending',
      residentId: complaint.residentId || 'anonymous',
      flatNumber: complaint.flatNumber || '',
      phone: complaint.phone || '',
      priority: complaint.priority || 'Medium',
      createdAt: new Date().toISOString(),
      date: complaint.date || new Date().toISOString()
    };
    await setDoc(docRef, data);
    return data;
  },

  async updateComplaint(id, complaint) {
    const docRef = doc(db, 'complaints', id);
    await updateDoc(docRef, complaint);
  },

  async deleteComplaint(id) {
    await deleteDoc(doc(db, 'complaints', id));
  },

  // === VISITORS SERVICE ===
  async getVisitors() {
    const ref = collection(db, 'visitors');
    const snap = await getDocs(ref);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addVisitor(visitor) {
    const id = `v_${Date.now()}`;
    const docRef = doc(db, 'visitors', id);
    const data = {
      id,
      visitorName: visitor.visitorName || visitor.name || '',
      name: visitor.name || visitor.visitorName || '',
      phone: visitor.phone || '',
      residentId: visitor.residentId || visitor.flatNumber || '',
      flatNumber: visitor.flatNumber || visitor.residentId || '',
      visitDate: new Date().toISOString(),
      entryTime: visitor.entryTime || new Date().toISOString(),
      status: 'Inside',
      purpose: visitor.purpose || 'Social',
      numVisitors: visitor.numVisitors || 1,
      recordedBy: visitor.recordedBy || 'Gatekeeper'
    };
    await setDoc(docRef, data);
    return data;
  },

  async checkoutVisitor(id) {
    const docRef = doc(db, 'visitors', id);
    await updateDoc(docRef, {
      status: 'Checked-Out',
      exitTime: new Date().toISOString()
    });
  },

  // === MAINTENANCE BILLS SERVICE ===
  async getMaintenanceBills() {
    const ref = collection(db, 'maintenanceBills');
    const snap = await getDocs(ref);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addMaintenanceBill(bill) {
    const id = `b_${Date.now()}`;
    const docRef = doc(db, 'maintenanceBills', id);
    const data = {
      id,
      residentId: bill.residentId || bill.flatNumber || '',
      flatNumber: bill.flatNumber || bill.residentId || '',
      month: bill.month || bill.billingMonth || '',
      billingMonth: bill.billingMonth || bill.month || '',
      amount: bill.amount || 0,
      dueDate: bill.dueDate || '',
      paymentStatus: bill.paymentStatus || bill.status || 'Pending',
      status: bill.status || bill.paymentStatus || 'Pending'
    };
    await setDoc(docRef, data);
    return data;
  },

  async updateBillStatus(id, status) {
    const docRef = doc(db, 'maintenanceBills', id);
    const legacyRef = doc(db, 'payments', id);
    await updateDoc(docRef, { paymentStatus: status, status });
    try {
      await updateDoc(legacyRef, { status });
    } catch (e) {
      // safe fallback
    }
  }
};
