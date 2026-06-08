# EcoTrack AI: Hackathon Demo Script

> **Goal**: Present a high-impact, feature-complete walkthrough of EcoTrack AI in **3 minutes** or less.

---

## ⏱️ Timeline & Script Walkthrough

### 🎬 Part 1: Introduction (0:00 - 0:30)
* **Visual**: Show the **Landing Page** (`/`). Hover over features and scroll down to the statistics.
* **Script**:
  > *"Hello, judges! Today we are thrilled to present **EcoTrack AI**. Global carbon reduction can feel overwhelmingly complex. Most citizens want to live more sustainably, but don't know where their emissions originate.
  > EcoTrack AI solves this by giving users a personal, AI-powered carbon accounting panel. In under 3 minutes, they can calculate, track, and offset their carbon footprint through daily actions, community competitions, and Google Gemini advice."*

---

### 🧮 Part 2: Carbon Footprint Calculator (0:30 - 1:15)
* **Visual**: Click **"Calculate Footprint"** to navigate to `/calculator`. Go through the 5 steps:
  1. *Transportation*: Select "Gasoline Car" and set distance to 30 km.
  2. *Energy*: Set electricity to 250 kWh, AC usage to 6 hours.
  3. *Diet*: Select "Mixed Diet".
  4. *Shopping*: Select 4 packages, 2 fast-fashion items.
  5. *Waste*: Select "Sometimes" recycling, "Medium" plastics.
* **Action**: Click **"Calculate Footprint"** to show the results page.
* **Script**:
  > *"Let's see it in action. A new user enters our 5-step calculator. We assess travel patterns, AC runtimes, shopping behaviors, and recycling habits.
  > Upon hitting calculate, the backend computes emissions using standard factors. The user receives an instant Carbon Rating of 'D', a Carbon Score of 47, and is immediately awarded +50 XP Eco Points to jumpstart their sustainability journey."*

---

### 📊 Part 3: Carbon Dashboard & AI Coach (1:15 - 2:15)
* **Visual**: Click **"View Carbon Dashboard"** to navigate to `/dashboard`. Highlight the charts, the **AI Prediction Engine**, then click **"AI Coach"** in the Navbar to go to `/coach`.
* **Action**: In the Coach chat, click the preset button: *"How can I reduce my daily car carbon footprint?"*. Let Gemini generate the response, toggle the voice speaker to play the TTS audio.
* **Action**: Drag and drop a sample image/PDF to the **Receipt Scanner** upload box, and click **"Analyze Carbon Footprint"**. Show the parsed results and points pop up.
* **Script**:
  > *"Now, we navigate to our dashboard. Users see visual breakdowns of category splits via Recharts. The Gemini-powered **AI Prediction Engine** forecasts yearly emissions based on daily habits.
  > For personalized guidance, we visit the **AI Sustainability Coach**. We can ask custom queries or click preset buttons. Gemini replies with specific strategies, and users can toggle the voice speaker to hear vocal advice.
  > To eliminate logging friction, we built the **AI Receipt Scanner**. Users upload utility bills or fuel invoices; Gemini Vision parses consumption quantities and adds +30 XP points instantly."*

---

### 🏆 Part 4: Habits, Missions & Marketplace (2:15 - 2:45)
* **Visual**: Navigate to **"Habits & Missions"** (`/challenges`). Tick a couple of habits to show the points increase. Navigate to **"Tree Simulator"** (`/simulator`) and move the slider. Finally, go to **"Marketplace"** (`/marketplace`) and buy the "Amazon Reforestation" offset.
* **Script**:
  > *"Our **Daily Habit Tracker** gamifies sustainability. Ticking daily actions like taking public transit or avoiding plastics grants +10 XP.
  > Users can also join weekly missions like 'No Plastic Week' to earn massive rewards.
  > What can they do with their XP? Our **Tree Impact Simulator** demonstrates how planting trees offsets carbon equivalent to car trips or phone charges. In the **Marketplace**, they can spend points to fund verified green offset projects. Let's sponsor tree planting in the Amazon!"*

---

### 🏁 Part 5: Conclusion (2:45 - 3:00)
* **Visual**: Navigate back to `/dashboard`, click **"Download PDF Report"** to show the PDF generation download trigger. Go back to the **Landing Page** hero.
* **Script**:
  > *"Finally, users can download a dynamic, server-generated PDF audit detailing their scores and tailored recommendations.
  > EcoTrack AI is full-stack, responsive, and completely functional. It takes carbon tracking out of spreadsheets and puts it into an engaging daily game. Let's save the planet, one habit at a time. Thank you!"*
