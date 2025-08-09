// src/app/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Phone, Mail, MapPin, Bed, Wifi, Lock, Camera, Utensils, Droplet, Brush, ParkingSquare
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// Helper components
const SectionTitle = ({ title, emoji }) => (
  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center justify-center">
    {emoji} {title}
  </h2>
);

const AmenityItem = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
    <Icon className="w-7 h-7 text-blue-600" />
    <span className="text-gray-800 font-medium">{text}</span>
  </div>
);

// Data
const roomDetails = [
  {
    type: "Large Rooms (6-bed)",
    description: "2 rooms with 6 beds each. Each student gets a personal bed and locker.",
    image: "/images/bed.jpeg",
  },
  {
    type: "Medium Rooms (4-bed)",
    description: "3 rooms with 4 beds each. Fully ventilated and spacious with storage.",
    image: "/images/bed7.jpg",
  },
];

const rentDetails = [
  {
    roomType: "single bed rent in Large Room(6-bed Per Room)",
    prices: {
      "1-Month": { price: 1800, discount: null },
      "3-Months": { price: 5100, discount: "Save ₹300" },
      "6-Months": { price: 9600, discount: "Save ₹1200" },
      "1-Year": { price: 18000, discount: "Save ₹3600" },
    },
  },
  {
    roomType: "single bed rent in Small Room (4 bed Room )",
    prices: {
      "1-Month": { price: 1700, discount: null },
      "3-Months": { price: 4950, discount: "Save ₹150" },
      "6-Months": { price: 9300, discount: "Save ₹900" },
      "1-Year": { price: 18000, discount: "Save ₹2400" },
    },
  },
];

const amenities = [
  { icon: Wifi, text: "High-speed Wi-Fi" },
  { icon: Droplet, text: "Water purifier fitted (Drinking Water)" },
  { icon: Lock, text: "Personal Locker for each student" },
  { icon: Bed, text: "Individual beds with bedding" },
  { icon: Brush, text: "Daily Cleaning" },
  { icon: Camera, text: "24/7 CCTV surveillance" },
  { icon: Utensils, text: "Mess / Food Available" },
  { icon: ParkingSquare, text: "Parking available (2-Wheeler)" },
];

const testimonials = [
  {
    name: "Aman Sharma",
    text: "The best hostel I've stayed in. Clean rooms, great facilities, and a very friendly environment. The Wi-Fi is fast, which is a huge plus for students!",
  },
  {
    name: "Aditya Deshmukh",
    text: "Super affordable and all the amenities are well-maintained. The location is perfect for me, close to my college. Highly recommended!",
  },
];

const images = [
  "/images/bed.jpeg",
  "/images/bed7.jpg",
  "/images/bed6.png",
  "/images/hostel.png",
  "https://placehold.co/800x600/4b5563/ffffff?text=Hostel+Washroom",
];

const CONTACT_DETAILS = {
  phone: "+91 8624013521",
  email: "omkarok158@gmail.com",
  whatsapp: "8624013521",
  address: "K-33/4, Hudco, Navjivan Colony, N 11, Cidco, Chhatrapati Sambhajinagar, Maharashtra 431003",
  mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3753.6631835368364!2d75.33719017506992!3d19.897365037989914!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdba2a11b658d51%3A0xf67087955c4d2d7c!2sOmkar%20Palace!5e0!3m2!1sen!2sin!4v1692223790576!5m2!1sen!2sin",
  mapSrc: "https://maps.google.com/maps?q=19.91017,75.3495903&z=17&output=embed"
};

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDSdxE3dWYIbv-4Rn349pfF5lVolwUx1_c",
  authDomain: "omkar-palace-hostel.firebaseapp.com",
  projectId: "omkar-palace-hostel",
  storageBucket: "omkar-palace-hostel.firebasestorage.app",
  messagingSenderId: "1088633502020",
  appId: "1:1088633502020:web:388851e5ca10989abcff11",
  measurementId: "G-KX26B6TD9M",
};

export default function OmkarPalaceHostel() {
  const [selectedRoom, setSelectedRoom] = useState(rentDetails[0]);
  const [selectedDuration, setSelectedDuration] = useState("3-Months");
  const [calculatedTotal, setCalculatedTotal] = useState(null);
  const [monthlyPrice, setMonthlyPrice] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [formStatus, setFormStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Firebase init
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestoreDb = getFirestore(app);
    setDb(firestoreDb);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Auth error:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Rent calculation
  useEffect(() => {
    if (selectedRoom && selectedDuration) {
      const months = { "1-Month": 1, "3-Months": 3, "6-Months": 6, "1-Year": 12 }[selectedDuration];
      const total = selectedRoom.prices[selectedDuration].price;
      setCalculatedTotal(total);
      setMonthlyPrice(Math.round(total / months));
    }
  }, [selectedRoom, selectedDuration]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!db || !isAuthReady) {
      setFormStatus("error");
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "inquiries"), {
        ...formData,
        timestamp: serverTimestamp(),
        userId,
      });
      setFormStatus("success");
      setFormData({ name: "", email: "", message: "" });
    } catch {
      setFormStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLightbox = (image) => {
    setCurrentImage(image);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setCurrentImage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Hero Section */}
      <div
        className="relative h-screen bg-cover bg-center flex items-center justify-center text-white"
        style={{ backgroundImage: "url('/images/hostel.png')" }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative text-center p-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-lg">
            Omkar Palace Hostel
          </h1>
          <p className="mt-4 text-xl md:text-2xl font-light max-w-2xl mx-auto">
            Your home away from home. Comfortable, secure, and affordable living for students and professionals.
          </p>
          <Button className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105">
            Book a Tour
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 space-y-20">
        {/* About Us */}
        <section>
          <SectionTitle title="About Our Hostel" emoji="🏡" />
          <p className="text-lg text-center max-w-3xl mx-auto text-gray-700 leading-relaxed">
            At Omkar Palace, we believe in creating a comfortable, secure, and affordable living space...
          </p>
        </section>

        {/* Rooms */}
        <section>
          <SectionTitle title="Room Options" emoji="🛏️" />
          <div className="grid gap-10 md:grid-cols-2">
            {roomDetails.map((room, i) => (
              <Card key={i} className="hover:scale-105 duration-300 shadow-xl overflow-hidden rounded-xl">
                <img src={room.image} alt={room.type} className="w-full h-64 object-cover" />
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{room.type}</h3>
                  <p className="text-gray-600">{room.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Rent Calculator */}
        <section className="bg-gray-100 p-8 rounded-3xl shadow-inner">
          <SectionTitle title="Find Your Rent" emoji="💰" />
          <div className="max-w-4xl mx-auto">
            {/* Room Type */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {rentDetails.map((room, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedRoom(room)}
                  className={`p-6 border-4 rounded-xl cursor-pointer text-center font-semibold text-lg
                  ${selectedRoom.roomType === room.roomType ? "bg-blue-600 text-white" : "bg-white"}`}
                >
                  {room.roomType}
                </div>
              ))}
            </div>
            {/* Duration */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {Object.entries(selectedRoom.prices).map(([duration, details], i) => (
                <div
                  key={i}
                  onClick={() => setSelectedDuration(duration)}
                  className={`p-5 rounded-xl cursor-pointer text-center
                  ${selectedDuration === duration ? "bg-blue-600 text-white" : "bg-white"}`}
                >
                  <p className="font-bold text-xl">{duration}</p>
                  {details.discount && <p className="text-sm mt-1">{details.discount}</p>}
                </div>
              ))}
            </div>
            {/* Total */}
            {calculatedTotal && (
              <div className="mt-8 text-center p-6 bg-white rounded-2xl shadow-2xl">
                <p className="text-4xl font-extrabold text-blue-600">₹ {calculatedTotal.toLocaleString()}</p>
                <p className="text-xl mt-2">(₹ {monthlyPrice} per month)</p>
              </div>
            )}
          </div>
        </section>

        {/* Amenities */}
        <section>
          <SectionTitle title="What's Included" emoji="✨" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {amenities.map((a, i) => (
              <AmenityItem key={i} icon={a.icon} text={a.text} />
            ))}
          </div>
        </section>

        {/* Gallery */}
        <section>
          <SectionTitle title="Gallery" emoji="🖼️" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {images.map((src, i) => (
              <div key={i} onClick={() => openLightbox(src)} className="cursor-pointer overflow-hidden rounded-lg shadow-md">
                <img src={src} alt={`Hostel view ${i + 1}`} className="w-full h-48 object-cover" />
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section className="bg-blue-600 text-white p-12 rounded-3xl shadow-2xl">
          <SectionTitle title="Ready to Book?" emoji="📬" />
          <form onSubmit={handleFormSubmit} className="space-y-6 max-w-lg mx-auto">
            <input name="name" value={formData.name} onChange={handleFormChange} placeholder="Full Name" required className="w-full p-4 rounded-lg bg-white/20 text-white" />
            <input name="email" type="email" value={formData.email} onChange={handleFormChange} placeholder="Email Address" required className="w-full p-4 rounded-lg bg-white/20 text-white" />
            <textarea name="message" value={formData.message} onChange={handleFormChange} placeholder="Your Message..." required rows={4} className="w-full p-4 rounded-lg bg-white/20 text-white" />
            <Button type="submit" disabled={isSubmitting || !isAuthReady} className="w-full bg-white text-blue-600 font-bold py-4 text-lg rounded-full">
              {isSubmitting ? "Submitting..." : "Submit Inquiry"}
            </Button>
            {formStatus === "success" && <p className="text-center text-white mt-4">Inquiry submitted successfully!</p>}
            {formStatus === "error" && <p className="text-center text-red-300 mt-4">Something went wrong. Please try again.</p>}
          </form>
        </section>

        {/* Testimonials */}
        <section>
          <SectionTitle title="What Our Residents Say" emoji="💬" />
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((t, i) => (
              <Card key={i} className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-blue-600">
                <p className="text-lg italic text-gray-700">"{t.text}"</p>
                <p className="mt-4 text-right font-bold text-blue-600">- {t.name}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Map */}
        <section>
          <SectionTitle title="Our Location" emoji="📍" />
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <iframe src={CONTACT_DETAILS.mapSrc} width="100%" height="500" style={{ border: 0 }} allowFullScreen="" loading="lazy"></iframe>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 p-8 text-center mt-12">
        <div className="flex justify-center items-center gap-6 mb-4">
          <a href={`tel:${CONTACT_DETAILS.phone}`}><Phone /></a>
          <a href={`mailto:${CONTACT_DETAILS.email}`}><Mail /></a>
          <a href={`https://wa.me/${CONTACT_DETAILS.whatsapp}`} target="_blank" rel="noopener noreferrer">📞</a>
        </div>
        <p className="mb-2">{CONTACT_DETAILS.address}</p>
        <p>&copy; 2025 Omkar Palace. All rights reserved.</p>
      </footer>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={closeLightbox}>
          <div className="relative max-w-4xl max-h-full">
            <button onClick={closeLightbox} className="absolute top-4 right-4 text-white text-3xl font-bold p-2">&times;</button>
            <img src={currentImage} alt="Enlarged view" className="max-w-full max-h-screen object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
