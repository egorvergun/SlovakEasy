# Slovenský pre deti

This is a web application designed for learning vocabulary and language skills, built with Next.js. The project is aimed at children and features engaging learning modules, quizzes, and progress tracking. The application supports two user roles – teachers and students – each with its own set of functionalities.

## Project Features

- **User Registration and Login**  
  Users can sign up and log in to the system. Based on their role, different pages and functionalities are available:
  - **Students:** Access learning modules, take quizzes, and view their results.
  - **Teachers:** Add new topics, monitor student progress and statistics, and manage the content.

- **Learning System**  
  The learning module includes:
  - A topic selection interface (data is loaded from the `public/data.json` file).
  - Display of cards that include images and words.
  - Hints and audio support using the Web Speech API for both speech recognition and speech synthesis.
  - Interactive elements to facilitate an engaging learning experience.

- **Topic Management**  
  Teachers can add new topics and upload images through a dedicated form on the `/edit` page. All topic data is stored in a JSON file and displayed on the topic selection and statistics pages.

- **Results and Statistics**  
  Detailed statistics regarding completed tasks and quiz results are saved for each user. Teachers can review aggregated data for their students via API endpoints and dedicated pages.

- **Security**  
  Authentication is handled using JWT tokens. API requests are secured by verifying tokens and user roles.

## Technologies

- **Next.js 15** – Server-side rendering, routing, and API routes.
- **React** – Flexible UI built with a component-based architecture.
- **Tailwind CSS** – Styling and responsive design.
- **JWT** – User authentication and session management.
- **React Icons** – Icon library for visual elements.
- **Node.js API** – File system operations for uploading and storing data.

## Project Structure

- **app/**  
  Contains the application pages:
  - `page.js` – The main landing page.
  - `login/page.js` – Login form for user authentication.
  - `register/page.js` – User registration form.
  - `choose-role/page.js`, `topics/page.js` – Role selection and topic selection pages.
  - `learning/page.js` – The learning module.
  - `result/page.js` – Quiz results page.
  - `stats/page.js` – Statistics pages for both students and teachers.
  - `edit/page.js` – Form for adding or editing topics.

- **app/api/**  
  API routes for handling:
  - Authentication (`/api/login`, `/api/register`).
  - Topic management (`/api/add-topic`, `/api/topics`).
  - Saving results (`/api/save-result`).
  - Retrieving statistics for students (`/api/student-stats`) and teachers (`/api/teacher-stats`).

- **public/**  
  Publicly accessible files:
  - `uploads/` – Directory for uploaded images.
  - `data.json` – Data file containing topics and images for learning.
  - `users.json` – Contains user data (both teachers and students).

- **context/**  
  User context (`UserContext.js`) for managing information about the authenticated user.

## Installation and Running

1. **Clone the Repository:**

   ```bash
   git clone <repository_URL>
   cd bk_pr

2. **Install Dependencies:**

**Use either npm or yarn:**
    npm install
    # or
    yarn install

3. **Run in Development Mode:**

    npm run dev
    # or
    yarn dev

The application will be accessible at http://localhost:3000.

## Additional Information

**Web Speech API:**
The application utilizes the Web Speech API for speech recognition and synthesis, which is supported by modern browsers. For example, the SpeechRecognition (or webkitSpeechRecognition) interface is used for recognizing spoken words, whereas speechSynthesis is used for converting text to speech.

**Performance Optimizations:**
The application uses Turbopack to speed up the build and development process.

**Data Storage:**
User information is stored in users.json, while topics and images data are stored in data.json.

**Authentication and Authorization:**
JWT is used for secure authentication. Ensure that all API routes check for valid tokens and correct user roles before processing requests.