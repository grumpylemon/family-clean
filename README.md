# Family Compass 🏠✨

A beautiful, gamified family chore management app that transforms household responsibilities into an engaging, collaborative experience. Built with React Native, Expo, and Firebase, Family Compass helps families stay organized while making chores fun through achievements, XP systems, and friendly competition.

## 🌟 Key Features

### 🎮 Gamification & Motivation
- **XP & Leveling System**: Progress through 10 levels from "Novice Helper" to "Ultimate Family Helper"
- **Achievement System**: Unlock 11 unique achievements for milestones and consistency
- **Streak Tracking**: Build daily completion streaks with bonus multipliers
- **Point System**: Earn points for completing chores, redeemable for family rewards
- **Difficulty-Based Rewards**: Higher difficulty chores provide greater XP and point bonuses

### 👨‍👩‍👧‍👦 Family Management
- **Easy Family Setup**: Create or join families with simple invite codes
- **Member Profiles**: Beautiful avatars with activity status indicators
- **Role-Based Access**: Admin controls for chore management and family settings
- **Real-Time Sync**: Live updates across all family members' devices
- **Guest Access**: Try the app without account creation

### 📋 Smart Chore Management
- **Flexible Scheduling**: One-time, weekly, or custom recurring chores
- **Auto-Assignment**: Intelligent rotation among active family members
- **Difficulty Levels**: Easy, medium, and hard chores with appropriate rewards
- **Cooldown System**: Prevent chore spam with configurable lockout periods
- **Rich Descriptions**: Detailed instructions and expectations for each task

### 🎨 Beautiful Design
- **Pink Aesthetic**: Self-care inspired design with soft, calming colors
- **Modern UI**: Card-based layouts with smooth animations
- **Cross-Platform**: Native iOS, Android, and web experience
- **Accessibility**: High contrast, readable fonts, and intuitive navigation
- **Celebration Effects**: Confetti animations and reward modals for achievements

## 🚀 User Journey

### Getting Started
1. **Download & Launch**: Open Family Compass on your device
2. **Choose Your Path**: Sign in with Google or continue as guest
3. **Family Setup**: Create a new family or join existing one with invite code
4. **Profile Creation**: Add your photo and customize your profile

### Daily Experience
1. **Dashboard Overview**: See your stats, recent achievements, and family progress
2. **Chore Discovery**: Browse available chores with clear difficulty indicators
3. **Task Completion**: Mark chores complete and enjoy instant rewards
4. **Progress Tracking**: Watch your XP grow and unlock new achievements
5. **Family Interaction**: View leaderboards and celebrate others' successes

### Long-Term Engagement
- **Weekly Competitions**: Compete with family members for most points
- **Achievement Hunting**: Work toward unlocking all 11 achievements
- **Streak Building**: Maintain daily completion streaks for bonus rewards
- **Level Progression**: Advance through all 10 helper levels
- **Family Growth**: Add new members and expand your household team

## 💡 Benefits

### For Families
- **Reduced Nagging**: Clear expectations and self-motivation through gamification
- **Fair Distribution**: Automatic chore rotation ensures everyone contributes
- **Increased Participation**: Fun achievements encourage consistent engagement
- **Better Communication**: Shared visibility into household responsibilities
- **Flexible Scheduling**: Accommodates different family schedules and preferences

### For Parents
- **Administrative Control**: Manage chores, members, and family settings
- **Progress Visibility**: Track completion rates and family engagement
- **Customizable Rewards**: Set up point-based incentives that work for your family
- **Reduced Conflicts**: Clear systems eliminate arguments about fairness
- **Teaching Responsibility**: Gamification makes learning life skills enjoyable

### For Kids & Teens
- **Immediate Gratification**: Instant XP and point rewards for completion
- **Achievement Recognition**: Badges and levels provide sense of accomplishment
- **Friendly Competition**: Leaderboards motivate without harsh pressure
- **Skill Development**: Learn time management and responsibility through play
- **Family Connection**: Shared goals strengthen household teamwork

## 🛠 Technology Stack

- **Frontend**: React Native with Expo Router
- **Backend**: Firebase Firestore with real-time synchronization
- **Authentication**: Firebase Auth with Google Sign-In
- **Hosting**: Firebase Hosting for web deployment
- **Platform Support**: iOS, Android, and Progressive Web App

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Expo CLI (optional, but recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/grumpylemon/family-clean.git
   cd family-clean
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Choose your platform**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app

### Platform-Specific Commands

```bash
# Development
npm run android    # Start on Android
npm run ios        # Start on iOS simulator
npm run web        # Start web version

# Production builds
eas build --platform ios --auto-submit     # iOS App Store
eas build --platform android --profile production  # Google Play

# Web deployment
npx expo export --platform web
firebase deploy --only hosting
```

## 🌐 Live Demo

Try Family Compass in your browser: [https://family-fun-app.web.app](https://family-fun-app.web.app)

## 📱 Download

- **iOS**: Available on the App Store (App ID: 6746467670)
- **Android**: Available on Google Play Store
- **Web**: Access via any modern browser

## 🤝 Contributing

We welcome contributions! Please see our [development task list](docs/development_task_list.md) for current priorities and [implementation guide](docs/implement.md) for technical details.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

Built with love for families everywhere who want to make household management more collaborative, fair, and fun.

---

*Transform your family's approach to chores with Family Compass - where responsibility meets reward!* 🌟
