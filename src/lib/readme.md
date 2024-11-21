## `/src/lib`

Houses utility functions, helper modules, and shared logic used across the application. This folder helps keep the codebase DRY (Don't Repeat Yourself).

Example:

- `api.js` (for API calls)
- `utils.js` (for common utility functions)
- `constants.js` (for shared constants)


## Running Firestore Operations

To add and retrieve data from Firestore using the scripts in  `/src`:

1. **Setup Environment** :

* Ensure you have Node.js installed. We recommend using Node.js v16 or higher.
* Navigate to the root directory of your project.

1. **Install Dependencies** :

* Make sure all dependencies are installed using  `npm install`.
* To execute the Firestore operations defined in  `firestoreOperations.mjs`:

  ```node
  node src/firestoreOperations.mjs
  ```
* This script will:

  * Add a document to the `users` collection.
  * Retrieve all documents from the `users` collection and log them to the console.
* If you encounter errors like **`Cannot use import statement outside a module`, ensure your** **`package.json` includes** **`"type": "module"`.
* Ensure that** **`FirebaseConfig.js` correctly exports** **`db` and is correctly imported in** **`firestoreOperations.mjs`.

---
