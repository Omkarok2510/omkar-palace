"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Bed, Wifi, Lock, Camera, Utensils, GlassWaterIcon, BrushCleaningIcon, ParkingCircle } from "lucide-react";
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Data for room details.
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

// Data for rent details (using number values for calculation)
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
      "1-Year": { price: 18000, discount: "Save ₹2400" }
    },
  },
];

// Data for amenities
const amenities = [
  { icon: Wifi, text: "High-speed Wi-Fi" },
  { icon: GlassWaterIcon, text: "Water purifier fitted (Drinking Water)" },
  { icon: Lock, text: "Personal Locker for each student" },
  { icon: Bed, text: "Individual beds with bedding" },
  { icon: BrushCleaningIcon, text: 'Daily Cleaning' },
  { icon: Camera, text: "24/7 CCTV surveillance" },
  { icon: Utensils, text: "Mess / Food Available" }, // Added new amenity
  { icon: ParkingCircle, text: "Parking available (2-Wheeler)" }
];

// Data for testimonials
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

// Image URLs
const images = [
  "/images/bed.jpeg", // your own uploaded image
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
  mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3753.111956108151!2d75.34701542562423!3d19.910170029323145!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdbbd316d23d85b%3A0x433aebad5541715d!2sOmkar%20Palace!5e0!3m2!1sen!2sin!4v1716301211756!5m2!1sen!2sin"
};

// Use the Firebase configuration you provided directly in the code
const firebaseConfig = {
    apiKey: "AIzaSyDSdxE3dWYIbv-4Rn349pfF5lVolwUx1_c",
    authDomain: "omkar-palace-hostel.firebaseapp.com",
    projectId: "omkar-palace-hostel",
    storageBucket: "omkar-palace-hostel.firebasestorage.app",
    messagingSenderId: "1088633502020",
    appId: "1:1088633502020:web:388851e5ca10989abcff11",
    measurementId: "G-KX26B6TD9M"
};


export default function OmkarPalaceHostel() {
  // State for the rent calculator
  const [selectedRoom, setSelectedRoom] = useState(rentDetails[0]);
  const [selectedDuration, setSelectedDuration] = useState("3-Months");
  const [calculatedTotal, setCalculatedTotal] = useState(null);
  const [monthlyPrice, setMonthlyPrice] = useState(null);

  // State for the contact form
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [formStatus, setFormStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for the image lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  // State for Firebase
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false); // New state to track auth readiness

  // Firebase Initialization and Authentication
  useEffect(() => {
    let app;
    try {
      app = initializeApp(firebaseConfig);
    } catch (error) {
      console.error("Firebase App initialization failed:", error);
      return;
    }

    const auth = getAuth(app);
    const firestoreDb = getFirestore(app);
    setDb(firestoreDb);

    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    // Set up a single auth state change listener. This is the recommended way.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If a user is already signed in, we can proceed.
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
        console.log("Authenticated user detected:", user.uid);
      } else {
        // If no user is found, attempt to sign in.
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
            console.log("Signed in with custom token successfully.");
          } else {
            // Fallback to anonymous sign-in if no custom token is provided.
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
          }
        } catch (error) {
          console.error(
            "Authentication failed. Please ensure 'Anonymous' sign-in is enabled in your Firebase console under 'Authentication'. Detailed error:",
            error
          );
        }
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Recalculate total whenever room or duration changes
  useEffect(() => {
    if (selectedRoom && selectedDuration) {
      const durationInMonths = {
        "1-Month": 1,
        "3-Months": 3,
        "6-Months": 6,
        "1-Year": 12,
      }[selectedDuration];

      const total = selectedRoom.prices[selectedDuration].price;
      const monthly = Math.round(total / durationInMonths);

      setCalculatedTotal(total);
      setMonthlyPrice(monthly);
    } else {
      setCalculatedTotal(null);
      setMonthlyPrice(null);
    }
  }, [selectedRoom, selectedDuration]);

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  // Handle form submission and save to Firestore
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!db || !userId) {
      console.error("Firestore not initialized or user not authenticated.");
      setFormStatus("error");
      return;
    }
    
    setIsSubmitting(true);
    setFormStatus(null);
    
    // Construct the data to be saved, including a timestamp
    const inquiryData = {
      ...formData,
      timestamp: serverTimestamp(),
    };

    try {
      // Use the provided `__app_id` to create a unique collection path
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const collectionPath = `artifacts/${appId}/users/${userId}/inquiries`;
      
      console.log(`Attempting to add document to Firestore at path: ${collectionPath}`);
      await addDoc(collection(db, collectionPath), inquiryData);
      
      console.log("Form submitted successfully and saved to Firestore.");
      setFormStatus("success");

      // Reset the form data after a delay so the user can see the success message
      setTimeout(() => {
        setFormData({ name: "", email: "", message: "" });
        setFormStatus(null); // Clear the status after the form resets
      }, 3000); // 3-second delay
    } catch (error) {
      console.error("Error saving form data to Firestore:", error);
      setFormStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open the lightbox with a specific image
  const openLightbox = (imageSrc) => {
    setCurrentImage(imageSrc);
    setLightboxOpen(true);
  };

  // Close the lightbox
  const closeLightbox = () => {
    setLightboxOpen(false);
    setCurrentImage(null);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <header className="bg-gray-100 shadow-md p-6">
        <h1 className="text-3xl font-bold">Omkar Palace(Hostel)</h1>
        <p className="text-sm text-gray-600">Affordable student accommodation in your city</p>
        {userId && <p className="text-xs text-gray-400 mt-2">User ID: {userId}</p>}
      </header>

      <main className="p-6 grid gap-8">
        {/* About Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">🏠 About Us</h2>
          <p>
            At Omkar Palace, we believe in creating a comfortable, 
            secure, and affordable living space for students and 
            working professionals. Located in a prime area with easy access to 
            public transport, educational institutions, and essential services,
            our hostel is ideal for those seeking a hassle-free stay.
          </p>
        </section>

        {/* Room Details */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Room Details</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {roomDetails.map((room, index) => (
              <Card
                key={index}
                className="transition-transform hover:scale-105 duration-200 shadow-lg"
              >
                <img
                  src={room.image}
                  alt={room.type}
                  className="w-full h-48 object-cover rounded-t-md"
                />
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bed className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold">{room.type}</h3>
                  </div>
                  <p className="text-sm text-gray-700">{room.description}</p>
                  <Button className="mt-4">Book Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Rent Calculator */}
        <section>
          <div className="p-6 bg-gray-50 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Rent Calculator</h2>
            <p className="text-center text-gray-600 mb-8">Calculate your total rent based on the room type and lease duration.</p>
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">1. Choose a Room Type (per bed)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rentDetails.map((room, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${selectedRoom.roomType === room.roomType ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white border-gray-300 hover:border-blue-400"}`}
                  >
                    <div className={`text-lg font-bold ${selectedRoom.roomType === room.roomType ? "text-white" : "text-gray-800"}`}>{room.roomType}</div>
                    <p className={`mt-1 text-sm ${selectedRoom.roomType === room.roomType ? "text-blue-200" : "text-gray-600"}`}>
                      ₹ {room.prices["3-Months"].price.toLocaleString()} for 3 months
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">2. Select Lease Duration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(selectedRoom.prices).map(([duration, details], index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedDuration(duration)}
                    className={`p-4 border-2 rounded-xl text-center cursor-pointer transition-all duration-200 ${selectedDuration === duration ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white border-gray-300 hover:border-blue-400"}`}
                  >
                    <span className={`font-medium ${selectedDuration === duration ? "text-white" : "text-gray-800"}`}>{duration}</span>
                    {details.discount && (
                      <p className={`mt-1 text-xs font-semibold ${selectedDuration === duration ? "text-white" : "text-green-600"}`}>{details.discount}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {calculatedTotal !== null && (
              <div className="mt-8 bg-blue-50 p-6 rounded-xl text-center shadow-inner">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Total Rent</h3>
                <p className="text-5xl font-extrabold text-blue-600">₹ {calculatedTotal.toLocaleString()}</p>
                {monthlyPrice && (
                  <p className="text-sm text-gray-500 mt-2">
                    (That's just ₹ {monthlyPrice.toLocaleString()} per month!)
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Testimonials Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-center">What Our Residents Say</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-lg">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <p className="italic text-gray-600 mb-4">"{testimonial.text}"</p>
                  <p className="text-right font-bold text-blue-600">- {testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* What's Included */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">What's Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {amenities.map((amenity, index) => (
              <div key={index} className="flex items-center gap-3 bg-gray-100 p-4 rounded-md transition-transform hover:scale-105 duration-200">
                <amenity.icon className="w-6 h-6 text-blue-600" />
                <span className="text-lg">{amenity.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery */}
        <section className="p-4">
          <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((src, index) => (
              <div
                key={index}
                className="aspect-square overflow-hidden rounded-xl cursor-pointer transition-transform hover:scale-105 duration-200 shadow-lg"
                onClick={() => openLightbox(src)}
              >
                <img
                  src={src}
                  alt={`Hostel image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Book a Bed Section (Now with an embedded Contact Form) */}
        <section id="contact-form" className="bg-blue-600 text-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-2 text-center">Ready to Book a Bed?</h2>
          <p className="mb-4 text-center">
            Fill out the form below and we'll get back to you shortly to confirm your booking.
          </p>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-gray-800"
                disabled={isSubmitting || !isAuthReady}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-gray-800"
                disabled={isSubmitting || !isAuthReady}
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleFormChange}
                rows="4"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-gray-800"
                disabled={isSubmitting || !isAuthReady}
              ></textarea>
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="w-full text-blue-600 font-bold"
              disabled={isSubmitting || !isAuthReady}
            >
              {isSubmitting ? "Submitting..." : "Submit Inquiry"}
            </Button>
          </form>
          {formStatus === "success" && (
            <p className="mt-4 text-center font-semibold text-green-200">Thank you for your inquiry! We will contact you soon.</p>
          )}
          {formStatus === "error" && (
            <p className="mt-4 text-center font-semibold text-red-200">There was an error submitting your form. Please try again.</p>
          )}
          {!isAuthReady && (
            <p className="mt-4 text-center font-semibold text-white">Loading...</p>
          )}
        </section>

        {/* Embedded Map Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Our Location</h2>
          <div className="rounded-xl overflow-hidden shadow-lg aspect-[4/3] md:aspect-[16/9]">
            <iframe
              src={CONTACT_DETAILS.mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </section>

        {/* Contact details */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" /> <span>{CONTACT_DETAILS.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" /> <span>{CONTACT_DETAILS.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>{CONTACT_DETAILS.address}</span>
            </div>
            <Button asChild>
              <a href={`https://wa.me/${CONTACT_DETAILS.whatsapp}`} target="_blank" rel="noopener noreferrer">Message on WhatsApp</a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 p-4 text-center text-sm text-gray-500">
        © 2025 Omkar Palace. All rights reserved.
      </footer>

      {/* Image Lightbox/Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative w-full h-full max-w-4xl max-h-[90vh]">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white text-3xl font-bold p-2 z-10 hover:text-gray-300"
            >
              &times;
            </button>
            <img
              src={currentImage}
              alt="Enlarged hostel view"
              className="w-full h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
