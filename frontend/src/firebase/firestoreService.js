import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

/**
 * ── Save / Sync Booking to Firestore ─────────────────────────────
 * Saves or updates a photoshoot booking in the 'bookings' collection.
 */
export const saveBookingToFirestore = async (bookingData) => {
  try {
    const cleanData = {
      ...bookingData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // If a mongo / unique booking ID is present, use it as doc ID
    if (bookingData.bookingId || bookingData._id || bookingData.id) {
      const docId = String(bookingData.bookingId || bookingData._id || bookingData.id);
      const docRef = doc(db, 'bookings', docId);
      await setDoc(docRef, cleanData, { merge: true });
      return { success: true, id: docId };
    } else {
      const colRef = collection(db, 'bookings');
      const res = await addDoc(colRef, cleanData);
      return { success: true, id: res.id };
    }
  } catch (error) {
    console.error('Firestore saveBooking error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ── Save Payment Receipt to Firestore ─────────────────────────────
 * Logs verified payments and advance deposits into the 'payments' collection.
 */
export const savePaymentToFirestore = async (paymentData) => {
  try {
    const colRef = collection(db, 'payments');
    const res = await addDoc(colRef, {
      ...paymentData,
      timestamp: serverTimestamp()
    });
    return { success: true, id: res.id };
  } catch (error) {
    console.error('Firestore savePayment error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ── Save Contact / Inquiries to Firestore ─────────────────────────
 */
export const saveInquiryToFirestore = async (inquiryData) => {
  try {
    const colRef = collection(db, 'inquiries');
    const res = await addDoc(colRef, {
      ...inquiryData,
      timestamp: serverTimestamp()
    });
    return { success: true, id: res.id };
  } catch (error) {
    console.error('Firestore saveInquiry error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ── Test Firestore Connection ────────────────────────────────────
 * Writes a quick heartbeat ping to verify Firestore is active & connected.
 */
export const testFirestoreConnection = async () => {
  try {
    const testRef = doc(db, '_connection_test', 'status');
    await setDoc(testRef, {
      status: 'connected',
      connectedAt: serverTimestamp(),
      studio: 'MLP Kids Studio'
    }, { merge: true });
    return { success: true, message: 'Firestore connected successfully!' };
  } catch (error) {
    console.warn('Firestore connection test warning:', error);
    return { success: false, error: error.message };
  }
};
