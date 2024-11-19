import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from './FirebaseConfig.js'; 

// Function to add data
async function addData() {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      name: "John Doe",
      email: "john.doe@example.com",
      age: 25
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

// Function to retrieve data
async function getData() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
    });
  } catch (e) {
    console.error("Error retrieving documents: ", e);
  }
}

// Call the functions
addData();
getData();
